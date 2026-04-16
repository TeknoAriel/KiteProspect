/**
 * Validación y reporte seguro de variables KiteProp API (sin imprimir secretos).
 */

export type KitepropApiEnvPresence = {
  baseUrl: boolean;
  importPath: boolean;
  user: boolean;
  password: boolean;
  apiKey: boolean;
};

function baseUrlRaw(): string | null {
  return (
    process.env.KITEPROP_API_BASE_URL?.trim() ||
    process.env.KITEPROP_API_URL?.trim() ||
    null
  );
}

function importPathRaw(): string | null {
  return (
    process.env.KITEPROP_API_IMPORT_PATH?.trim() ||
    process.env.KITEPROP_API_LEADS_LIST_PATH?.trim() ||
    null
  );
}

export function readKitepropApiEnvPresence(): KitepropApiEnvPresence {
  return {
    baseUrl: Boolean(baseUrlRaw()),
    importPath: Boolean(importPathRaw()),
    user: Boolean(process.env.KITEPROP_API_USER?.trim()),
    password: Boolean(process.env.KITEPROP_API_PASSWORD?.trim()),
    apiKey: Boolean(process.env.KITEPROP_API_KEY?.trim()),
  };
}

/**
 * Variables mínimas para llamada HTTP real (sin fixture).
 * KiteProp (MCP / nube): suele bastar `KITEPROP_API_KEY` + cabecera `X-API-Key`.
 * Basic opcional si el tenant lo exige además de la key.
 */
export function validateKitepropApiForHttpImport():
  | { ok: true }
  | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!baseUrlRaw()) {
    errors.push(
      "KITEPROP_API_BASE_URL (o KITEPROP_API_URL) debe estar definida y no vacía.",
    );
  }
  if (!importPathRaw()) {
    errors.push(
      "KITEPROP_API_IMPORT_PATH (o KITEPROP_API_LEADS_LIST_PATH) debe estar definida y no vacía.",
    );
  }
  const hasKey = Boolean(process.env.KITEPROP_API_KEY?.trim());
  const hasBasic =
    Boolean(process.env.KITEPROP_API_USER?.trim()) &&
    Boolean(process.env.KITEPROP_API_PASSWORD?.trim());
  if (!hasKey && !hasBasic) {
    errors.push(
      "Definí KITEPROP_API_KEY (recomendado, cabecera X-API-Key) o el par KITEPROP_API_USER + KITEPROP_API_PASSWORD.",
    );
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

/** URL base solo host + protocolo (sin credenciales). */
export function formatBaseUrlForLog(urlRaw: string | undefined): string {
  if (!urlRaw?.trim()) return "(no definido)";
  const s = urlRaw.trim();
  try {
    const u = new URL(s.includes("://") ? s : `https://${s}`);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "(formato inválido)";
  }
}

export function formatImportPathForLog(): string {
  const p = importPathRaw();
  return p ?? "(no definido)";
}

/** Usuario: solo longitud y si parece email, dominio truncado. */
export function formatUserForLog(): string {
  const u = process.env.KITEPROP_API_USER?.trim();
  if (!u) return "(no definido)";
  if (u.includes("@")) {
    const [a, d] = u.split("@");
    return `${a.slice(0, 2)}***@${d ?? ""}`;
  }
  return `(${u.length} caracteres)`;
}

export function formatApiKeyForLog(): string {
  return process.env.KITEPROP_API_KEY?.trim() ? "definida (valor oculto)" : "(no definida)";
}

export function printKitepropApiEnvReportLines(): string[] {
  const p = readKitepropApiEnvPresence();
  return [
    "Variables (presencia, sin secretos):",
    `  KITEPROP_API_BASE_URL: ${p.baseUrl ? formatBaseUrlForLog(baseUrlRaw() ?? undefined) : "NO"}`,
    `  KITEPROP_API_IMPORT_PATH: ${p.importPath ? formatImportPathForLog() : "NO"}`,
    `  KITEPROP_API_USER: ${p.user ? formatUserForLog() : "NO"}`,
    `  KITEPROP_API_PASSWORD: ${p.password ? "*** (definida)" : "NO"}`,
    `  KITEPROP_API_KEY: ${formatApiKeyForLog()}`,
    `  KITEPROP_API_KEY_HEADER: ${process.env.KITEPROP_API_KEY_HEADER?.trim() || "(default X-API-Key, alias X-Api-Key)"}`,
    `  KITEPROP_API_HTTP_METHOD: ${process.env.KITEPROP_API_HTTP_METHOD?.trim() || "GET"}`,
    `  KITEPROP_API_GET_DATE_QUERY_STYLE: ${process.env.KITEPROP_API_GET_DATE_QUERY_STYLE?.trim() || "all (from,to,from_date,to_date)"}`,
    `  KITEPROP_API_RESPONSE_LIST_KEYS: ${process.env.KITEPROP_API_RESPONSE_LIST_KEYS?.trim() || "(solo claves por defecto en código)"}`,
  ];
}
