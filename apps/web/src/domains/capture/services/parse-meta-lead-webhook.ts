/**
 * Extrae datos mínimos del payload de webhook Lead Ads de Meta (F2-E6).
 * Formato documentado: object=page, entry[].changes[].field=leadgen, value.field_data[].
 */
export type ParsedMetaLead = {
  pageId: string;
  leadgenId: string | null;
  fieldData: Array<{ name: string; values: string[] }>;
};

export function tryParseMetaLeadWebhook(body: unknown): ParsedMetaLead | null {
  if (body === null || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (b.object !== "page") return null;
  const entry = Array.isArray(b.entry) ? b.entry[0] : null;
  if (!entry || typeof entry !== "object") return null;
  const ent = entry as Record<string, unknown>;
  const pageId = typeof ent.id === "string" ? ent.id : null;
  if (!pageId) return null;

  const changes = Array.isArray(ent.changes) ? ent.changes[0] : null;
  if (!changes || typeof changes !== "object") return null;
  const ch = changes as Record<string, unknown>;
  if (ch.field !== "leadgen") return null;
  const value = ch.value;
  if (value === null || typeof value !== "object") return null;
  const val = value as Record<string, unknown>;
  const leadgenId = typeof val.leadgen_id === "string" ? val.leadgen_id : null;
  const rawFields = Array.isArray(val.field_data) ? val.field_data : [];
  const fieldData: Array<{ name: string; values: string[] }> = [];
  for (const row of rawFields) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name : "";
    const values = Array.isArray(r.values)
      ? r.values.filter((x): x is string => typeof x === "string")
      : [];
    if (name) fieldData.push({ name, values });
  }

  return { pageId, leadgenId, fieldData };
}

export function metaFieldValue(
  fieldData: ParsedMetaLead["fieldData"],
  ...names: string[]
): string | undefined {
  const lower = names.map((n) => n.toLowerCase());
  for (const row of fieldData) {
    if (lower.includes(row.name.toLowerCase()) && row.values[0]) {
      return row.values[0]!.trim();
    }
  }
  for (const row of fieldData) {
    const n = row.name.toLowerCase();
    if (n.includes("email") && row.values[0]) return row.values[0]!.trim();
    if (n.includes("phone") && row.values[0]) return row.values[0]!.trim();
    if ((n.includes("full_name") || n === "nombre") && row.values[0]) return row.values[0]!.trim();
  }
  return undefined;
}
