/**
 * Extra JSON en SearchProfile: exclusiones de propiedades para matching (F2-E2).
 */
const CUID_LIKE = /^[a-z0-9]{20,32}$/i;

export function parseExcludedPropertyIdsFromProfileExtra(extra: unknown): Set<string> {
  const out = new Set<string>();
  if (extra === null || extra === undefined || typeof extra !== "object" || Array.isArray(extra)) {
    return out;
  }
  const arr = (extra as { excludedPropertyIds?: unknown }).excludedPropertyIds;
  if (!Array.isArray(arr)) return out;
  for (const id of arr) {
    if (typeof id !== "string") continue;
    const t = id.trim();
    if (CUID_LIKE.test(t)) out.add(t);
  }
  return out;
}
