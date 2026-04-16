/**
 * Cliente HTTP para lectura desde KiteProp REST API.
 *
 * **Request:** `{KITEPROP_API_BASE_URL}` + `{KITEPROP_API_IMPORT_PATH}` — método y fechas vía env (ver `kiteprop-api-list-request.ts`, `docs/kiteprop-api-import-setup.md`).
 * - Auth: `KITEPROP_API_KEY` (cabecera `X-API-Key` por defecto) y/o Basic (`KITEPROP_API_USER` / `KITEPROP_API_PASSWORD`) según el tenant.
 * - Query de fechas en GET configurable (`KITEPROP_API_GET_DATE_QUERY_STYLE`); POST opcional con body JSON.
 * - Respuesta: JSON con array en raíz o bajo `data` | `leads` | `messages` | `contacts` | `items` | `results` | `records`.
 *
 * **Fixture local (sin red):** `KITEPROP_IMPORT_LIST_FIXTURE` = ruta a JSON (desde cwd del proceso, ej. repo root).
 *
 * Cada ítem se normaliza con `normalize-kiteprop-api-item.ts`. Si el shape real difiere, ampliar solo el normalizador.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateKitepropApiForHttpImport } from "./kiteprop-api-env";
import { executeKitepropListHttp } from "./kiteprop-api-list-request";
import { normalizeKitepropApiItem } from "./normalize-kiteprop-api-item";
import type { KitepropRestFetchParams } from "./kiteprop-rest-types";
import type { NormalizedKitepropImport } from "./kiteprop-rest-types";

const DEFAULT_LIST_KEYS = [
  "data",
  "leads",
  "messages",
  "contacts",
  "items",
  "results",
  "records",
];

function extractItems(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    const extra = process.env.KITEPROP_API_RESPONSE_LIST_KEYS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const keys = [...new Set([...DEFAULT_LIST_KEYS, ...(extra ?? [])])];
    for (const k of keys) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

async function loadItemsFromFixtureFile(
  rawPath: string,
): Promise<{ ok: true; items: NormalizedKitepropImport[] } | { ok: false; error: string }> {
  try {
    const abs = resolve(process.cwd(), rawPath);
    const buf = await readFile(abs, "utf8");
    const json = JSON.parse(buf) as unknown;
    const rawItems = extractItems(json);
    const items: NormalizedKitepropImport[] = [];
    for (const raw of rawItems) {
      const n = normalizeKitepropApiItem(raw);
      if (n) items.push(n);
    }
    return { ok: true, items };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: `KITEPROP_IMPORT_LIST_FIXTURE (${rawPath}): ${msg}`,
    };
  }
}

/**
 * GET listado con rango de fechas (query params genéricos; ajustar cuando la API oficial lo fije).
 */
export async function fetchKitepropLeadsForRange(
  params: KitepropRestFetchParams,
): Promise<{ ok: true; items: NormalizedKitepropImport[] } | { ok: false; error: string }> {
  const fixturePath = process.env.KITEPROP_IMPORT_LIST_FIXTURE?.trim();
  if (fixturePath) {
    const fromFixture = await loadItemsFromFixtureFile(fixturePath);
    if (!fromFixture.ok) {
      return { ok: false, error: fromFixture.error };
    }
    void params;
    return { ok: true, items: fromFixture.items };
  }

  const required = validateKitepropApiForHttpImport();
  if (!required.ok) {
    return {
      ok: false,
      error: required.errors.join(" "),
    };
  }

  let res: Response;
  try {
    res = await executeKitepropListHttp(params.since, params.until);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  if (!res.ok) {
    const t = await res.text();
    return {
      ok: false,
      error: `HTTP ${res.status}: ${t.slice(0, 500)}`,
    };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, error: "Respuesta no JSON" };
  }

  const rawItems = extractItems(json);
  const items: NormalizedKitepropImport[] = [];
  for (const raw of rawItems) {
    const n = normalizeKitepropApiItem(raw);
    if (n) items.push(n);
  }

  return { ok: true, items };
}
