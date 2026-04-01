/**
 * Línea JSON por evento (Vercel / consola). Sin PII: solo ids y contadores.
 */
export function logStructured(event: string, fields: Record<string, string | number | boolean | null | undefined>): void {
  const payload: Record<string, unknown> = { event, ts: new Date().toISOString() };
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) payload[k] = v;
  }
  console.log(JSON.stringify(payload));
}
