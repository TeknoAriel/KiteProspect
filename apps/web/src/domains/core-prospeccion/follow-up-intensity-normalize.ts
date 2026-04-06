/**
 * Normaliza intensidad de plan (legacy low/medium/high → oficial) y reglas de cambio por rama.
 */
import type { FollowUpBranchKey } from "./follow-up-branches";
import type { FollowUpIntensityKey } from "./follow-up-intensity";

const LEGACY_MAP: Record<string, FollowUpIntensityKey> = {
  low: "soft",
  medium: "normal",
  high: "strong",
  soft: "soft",
  normal: "normal",
  strong: "strong",
  priority: "priority",
  prioritario: "priority",
};

/**
 * Convierte valor de `FollowUpPlan.intensity` (nuevo o legacy) a clave oficial.
 */
export function normalizePlanIntensity(raw: string | null | undefined): FollowUpIntensityKey {
  const s = String(raw ?? "normal")
    .trim()
    .toLowerCase();
  return LEGACY_MAP[s] ?? "normal";
}

/**
 * Propuesta de siguiente intensidad según rama automática (producto).
 * `null` = mantener; el motor futuro puede persistir en plan o nueva secuencia.
 */
export function suggestNextIntensityAfterBranch(
  branch: FollowUpBranchKey,
  current: FollowUpIntensityKey,
): FollowUpIntensityKey | null {
  switch (branch) {
    case "good_response":
      if (current === "soft") return "normal";
      if (current === "normal") return "strong";
      if (current === "strong") return "priority";
      return null;
    case "no_response":
      if (current === "priority") return "strong";
      if (current === "strong") return "normal";
      if (current === "normal") return "soft";
      return null;
    case "low_response":
      if (current === "priority") return "strong";
      if (current === "strong") return "normal";
      return null;
    case "blocked_lead":
      return null;
    case "high_match":
      if (current === "soft") return "normal";
      if (current === "normal") return "strong";
      return null;
    case "no_match_now":
      return current === "soft" ? null : "soft";
    default:
      return null;
  }
}
