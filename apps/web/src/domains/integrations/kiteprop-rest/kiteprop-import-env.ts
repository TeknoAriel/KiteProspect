/**
 * Variables server-side para importación desde KiteProp REST API.
 * No exponer al cliente.
 */
export type KitepropRestEnv = {
  baseUrl: string | null;
  user: string | null;
  password: string | null;
  apiKey: string | null;
  /** Path relativo al base (ej. /api/v1/leads). Vacío = sin llamada HTTP. */
  importPath: string | null;
  lookbackDays: number;
  reviewMode: boolean;
};

export function readKitepropImportEnv(): KitepropRestEnv {
  const base =
    process.env.KITEPROP_API_BASE_URL?.trim() ||
    process.env.KITEPROP_API_URL?.trim() ||
    null;
  const path =
    process.env.KITEPROP_API_IMPORT_PATH?.trim() ||
    process.env.KITEPROP_API_LEADS_LIST_PATH?.trim() ||
    null;
  const days = Math.min(
    90,
    Math.max(
      1,
      Number.parseInt(process.env.KITEPROP_IMPORT_LOOKBACK_DAYS ?? "7", 10) || 7,
    ),
  );
  return {
    baseUrl: base,
    user: process.env.KITEPROP_API_USER?.trim() ?? null,
    password: process.env.KITEPROP_API_PASSWORD?.trim() ?? null,
    apiKey: process.env.KITEPROP_API_KEY?.trim() ?? null,
    importPath: path,
    lookbackDays: days,
    reviewMode: process.env.KITEPROP_IMPORT_REVIEW_MODE?.trim() === "true",
  };
}

export function kitepropImportReviewModeEnabled(): boolean {
  return readKitepropImportEnv().reviewMode;
}
