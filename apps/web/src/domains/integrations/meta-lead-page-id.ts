/**
 * Normaliza el Page ID de Meta (Facebook) para Lead Ads.
 * IDs numéricos; en producción suelen tener 15+ dígitos.
 */
const META_PAGE_ID_RE = /^\d{6,32}$/;

export function normalizeMetaLeadPageId(raw: string): string | null {
  const s = raw.trim();
  if (!META_PAGE_ID_RE.test(s)) return null;
  return s;
}

export function readPageIdFromIntegrationConfig(config: unknown): string | null {
  if (config === null || typeof config !== "object" || Array.isArray(config)) return null;
  const pid = (config as Record<string, unknown>).pageId;
  return typeof pid === "string" && pid.length > 0 ? pid : null;
}
