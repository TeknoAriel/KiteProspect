/**
 * Salta pasos de la matriz oficial cuando el perfil ya cubre el objetivo de la etapa (v1 conservadora).
 * Ver `docs/diferencias-vs-implementacion-actual.md`.
 */
import type { FollowUpCoreStageKey } from "./follow-up-core-stages";
import { getOfficialMatrixRow } from "./follow-up-official-matrix";
import type { FollowUpIntensityKey } from "./follow-up-intensity";

export type SearchProfileLite = {
  intent: string | null;
  zone: string | null;
  propertyType: string | null;
  minPrice: unknown;
  maxPrice: unknown;
  bedrooms: number | null;
};

export type ProfileSkipContext = {
  conversationalStage: string;
  searchProfiles: SearchProfileLite[];
  declaredProfile: unknown;
};

function aggregate(p: SearchProfileLite[]) {
  const hasIntent = p.some((r) => Boolean(r.intent?.trim()));
  const hasZone = p.some((r) => Boolean(r.zone?.trim()));
  const hasType = p.some((r) => Boolean(r.propertyType?.trim()));
  const hasPrice = p.some((r) => r.minPrice != null || r.maxPrice != null);
  const hasBedrooms = p.some((r) => r.bedrooms != null && r.bedrooms > 0);
  return { hasIntent, hasZone, hasType, hasPrice, hasBedrooms };
}

function declaredHasTiming(declared: unknown): boolean {
  if (!declared || typeof declared !== "object") return false;
  const o = declared as Record<string, unknown>;
  const t = o.timing ?? o.urgency ?? o.plazo;
  return typeof t === "string" && t.trim().length > 0;
}

/**
 * true = el paso con esta etapa del núcleo puede omitirse (no enviar otro toque solo para pedir ese dato).
 */
export function shouldSkipCoreStage(stage: FollowUpCoreStageKey, ctx: ProfileSkipContext): boolean {
  const conv = ctx.conversationalStage;
  const a = aggregate(ctx.searchProfiles);
  const timing = declaredHasTiming(ctx.declaredProfile);

  switch (stage) {
    case "activation":
      return conv !== "new";
    case "focus":
      return a.hasIntent && (a.hasZone || a.hasType);
    case "qualification":
      return a.hasIntent && a.hasPrice && (a.hasBedrooms || timing);
    case "refinement":
      return a.hasIntent && a.hasZone && a.hasPrice && a.hasBedrooms;
    case "conversion":
    case "reactivation":
      return false;
    default:
      return false;
  }
}

/**
 * Avanza el índice de paso mientras la fila de matriz oficial para ese índice sea omitible.
 * Si se llega al final, devuelve `stepsLength` (el caller debe cerrar la secuencia).
 */
export function advancePastSkippableSteps(
  intensityKey: FollowUpIntensityKey,
  stepsLength: number,
  startIdx: number,
  ctx: ProfileSkipContext,
): { nextIndex: number; skipped: number } {
  let i = Math.max(0, startIdx);
  let skipped = 0;
  while (i < stepsLength) {
    const row = getOfficialMatrixRow(intensityKey, i);
    if (!row) break;
    if (!shouldSkipCoreStage(row.coreStageKey, ctx)) break;
    skipped++;
    i++;
  }
  return { nextIndex: i, skipped };
}
