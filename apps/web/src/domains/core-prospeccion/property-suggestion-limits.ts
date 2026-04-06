/**
 * Límites de sugerencias de propiedades (fases tempranas vs match fuerte).
 * Ver `docs/core-prospeccion.md` § sugerencia.
 */
export const PROPERTY_SUGGESTIONS_EARLY_MAX = 3;
export const PROPERTY_SUGGESTIONS_STRONG_MAX = 5;

/** Cuántas filas de PropertyMatch mostrar en ficha (ordenadas por score + desempate). */
export const PROPERTY_MATCHES_UI_LIMIT = PROPERTY_SUGGESTIONS_STRONG_MAX;
