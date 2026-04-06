/**
 * Heurística v1 para `FollowUpSequence.matrixBranchKey`.
 * Conservadora: solo asigna cuando la señal es clara; si no, devuelve null.
 */
import type { FollowUpBranchKey } from "./follow-up-branches";

const MS_PER_HOUR = 60 * 60 * 1000;

export type InferMatrixBranchInput = {
  commercialStage: string;
  conversationalStage: string;
  topMatchScore: number | null;
  matchCount: number;
  /** true si hay intención o zona o algún rango de precio en perfil(es) del contacto */
  hasProfileBasics: boolean;
  /**
   * Último mensaje del hilo (cualquier conversación del contacto).
   * Si es `outbound` y lleva ≥ `noResponseAfterOutboundHours` sin un inbound posterior, → `no_response`.
   */
  lastMessageDirection?: "inbound" | "outbound" | null;
  lastMessageAtMs?: number | null;
  /** Reloj de referencia (tests / cron pasan `Date.now()`). */
  nowMs?: number;
  /** Default 48. */
  noResponseAfterOutboundHours?: number;
};

const HIGH_MATCH_MIN = 72;

export function inferFollowUpMatrixBranch(input: InferMatrixBranchInput): FollowUpBranchKey | null {
  const com = input.commercialStage;
  const conv = input.conversationalStage;

  if (com === "blocked") return "blocked_lead";

  if (input.topMatchScore != null && input.topMatchScore >= HIGH_MATCH_MIN) {
    return "high_match";
  }

  if (input.matchCount === 0 && input.hasProfileBasics) {
    return "no_match_now";
  }

  const nowMs = input.nowMs;
  if (
    input.lastMessageDirection === "outbound" &&
    input.lastMessageAtMs != null &&
    nowMs != null
  ) {
    const hours = input.noResponseAfterOutboundHours ?? 48;
    if (nowMs - input.lastMessageAtMs >= hours * MS_PER_HOUR) {
      return "no_response";
    }
  }

  if (com === "hot" || com === "real_lead" || com === "opportunity_active") {
    return "good_response";
  }

  if (conv === "profiled_useful" || conv === "followup_active") {
    return "good_response";
  }

  if (conv === "new" || conv === "answered") {
    return "low_response";
  }

  return null;
}
