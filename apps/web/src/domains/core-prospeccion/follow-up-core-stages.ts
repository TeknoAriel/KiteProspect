/**
 * Etapas conceptuales del seguimiento asistido (objetivo por fase).
 * No reemplazan claves Prisma hasta migración; guían IA, prompts y documentación.
 */
export const FOLLOW_UP_CORE_STAGE_KEYS = [
  "activation",
  "focus",
  "qualification",
  "refinement",
  "conversion",
  "reactivation",
] as const;

export type FollowUpCoreStageKey = (typeof FOLLOW_UP_CORE_STAGE_KEYS)[number];

/** Etiquetas UI (español) para las 6 etapas del núcleo de seguimiento. */
export const FOLLOW_UP_CORE_STAGE_LABEL_ES: Record<FollowUpCoreStageKey, string> = {
  activation: "Activación",
  focus: "Enfoque",
  qualification: "Cualificación",
  refinement: "Afinado",
  conversion: "Conversión",
  reactivation: "Reactivación",
};

export function labelFollowUpCoreStage(key: string | null | undefined): string {
  if (!key) return "—";
  const k = key as FollowUpCoreStageKey;
  return FOLLOW_UP_CORE_STAGE_LABEL_ES[k] ?? key;
}
