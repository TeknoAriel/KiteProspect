/**
 * Normalización del ID en CRM externo (`Contact.externalId`). F3-E1 slice mínimo.
 */
const MAX_LEN = 256;

export type NormalizeContactExternalIdResult =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

/** Acepta string recortado, vacío → null, o null explícito para borrar. */
export function normalizeContactExternalId(raw: unknown): NormalizeContactExternalIdResult {
  if (raw === null) {
    return { ok: true, value: null };
  }
  if (raw === undefined) {
    return { ok: false, error: "Se requiere externalId (string) o null" };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "externalId debe ser texto o null" };
  }
  const t = raw.trim();
  if (t.length === 0) {
    return { ok: true, value: null };
  }
  if (t.length > MAX_LEN) {
    return { ok: false, error: `externalId demasiado largo (máx. ${MAX_LEN} caracteres)` };
  }
  return { ok: true, value: t };
}
