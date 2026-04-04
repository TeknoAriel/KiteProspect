/**
 * Evalúa `FollowUpPlan.triggers` (F2-E5) antes de ejecutar un paso de secuencia.
 * Si no se cumple, el cron reprograma sin avanzar paso ni crear intento.
 */
export type FollowUpTriggersConfig = {
  minTotalScore?: number;
  commercialStageIn?: string[];
  conversationalStageIn?: string[];
};

export function parseFollowUpTriggers(json: unknown): FollowUpTriggersConfig | null {
  if (json === null || json === undefined) return null;
  if (typeof json !== "object" || Array.isArray(json)) return null;
  const o = json as Record<string, unknown>;
  const out: FollowUpTriggersConfig = {};

  if (typeof o.minTotalScore === "number" && Number.isFinite(o.minTotalScore)) {
    out.minTotalScore = o.minTotalScore;
  }
  if (Array.isArray(o.commercialStageIn)) {
    const arr = o.commercialStageIn.filter((x): x is string => typeof x === "string" && x.trim() !== "");
    if (arr.length > 0) out.commercialStageIn = arr;
  }
  if (Array.isArray(o.conversationalStageIn)) {
    const arr = o.conversationalStageIn.filter((x): x is string => typeof x === "string" && x.trim() !== "");
    if (arr.length > 0) out.conversationalStageIn = arr;
  }

  return Object.keys(out).length > 0 ? out : null;
}

export type FollowUpTriggerContext = {
  commercialStage: string;
  conversationalStage: string;
  totalScore: number | null;
};

export function evaluateFollowUpTriggers(
  triggersJson: unknown,
  ctx: FollowUpTriggerContext,
): { ok: true } | { ok: false; reason: string } {
  const t = parseFollowUpTriggers(triggersJson);
  if (!t) return { ok: true };

  if (t.minTotalScore != null) {
    const ts = ctx.totalScore;
    if (ts === null || ts < t.minTotalScore) {
      return { ok: false, reason: "minTotalScore" };
    }
  }

  if (t.commercialStageIn && t.commercialStageIn.length > 0) {
    if (!t.commercialStageIn.includes(ctx.commercialStage)) {
      return { ok: false, reason: "commercialStageIn" };
    }
  }

  if (t.conversationalStageIn && t.conversationalStageIn.length > 0) {
    if (!t.conversationalStageIn.includes(ctx.conversationalStage)) {
      return { ok: false, reason: "conversationalStageIn" };
    }
  }

  return { ok: true };
}
