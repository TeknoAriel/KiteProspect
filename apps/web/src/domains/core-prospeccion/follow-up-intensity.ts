/**
 * Intensidades oficiales de seguimiento (estrategia, no solo cantidad).
 * Claves en inglés para persistencia; etiquetas en `docs/seguimiento-y-cualificacion.md`.
 */
export const FOLLOW_UP_INTENSITY_KEYS = ["soft", "normal", "strong", "priority"] as const;

export type FollowUpIntensityKey = (typeof FOLLOW_UP_INTENSITY_KEYS)[number];

/** Máximo de intentos de contacto sugerido por intensidad (configurable por plan). */
export const INTENSITY_DEFAULT_MAX_ATTEMPTS: Record<FollowUpIntensityKey, number> = {
  soft: 4,
  normal: 6,
  strong: 8,
  priority: 10,
};

export function isFollowUpIntensityKey(s: string): s is FollowUpIntensityKey {
  return (FOLLOW_UP_INTENSITY_KEYS as readonly string[]).includes(s);
}

export const FOLLOW_UP_INTENSITY_LABEL_ES: Record<FollowUpIntensityKey, string> = {
  soft: "Suave",
  normal: "Normal",
  strong: "Fuerte",
  priority: "Prioritario",
};
