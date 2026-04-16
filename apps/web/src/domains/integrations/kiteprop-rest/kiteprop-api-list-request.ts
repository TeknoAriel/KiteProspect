/**
 * Construcción de URL y request HTTP al listado configurado por env.
 * No fija endpoints: todo viene de KITEPROP_API_BASE_URL + KITEPROP_API_IMPORT_PATH.
 */
import { readKitepropImportEnv } from "./kiteprop-import-env";

function resolvePathCandidates(): string[] {
  const env = readKitepropImportEnv();
  const extraCandidates = process.env.KITEPROP_API_IMPORT_PATH_CANDIDATES?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const defaults = ["/api/v1/leads", "/api/leads", "/v1/leads", "/leads"];
  const configured = env.importPath ? [env.importPath] : [];
  return [...new Set([...configured, ...(extraCandidates ?? []), ...defaults])];
}

function buildKitepropListUrlForPath(
  baseUrl: string,
  importPath: string,
  since: Date,
  until: Date,
): URL {
  const base = baseUrl.replace(/\/$/, "");
  const path = importPath.startsWith("/") ? importPath : `/${importPath}`;
  const url = new URL(path, `${base}/`);
  const method = (process.env.KITEPROP_API_HTTP_METHOD?.trim() || "GET").toUpperCase();
  const postLike = method === "POST" || method === "PUT";
  const appendQueryForPost =
    postLike && process.env.KITEPROP_API_POST_APPEND_QUERY_TO_URL?.trim() === "true";

  if (postLike && !appendQueryForPost) {
    return url;
  }

  const style =
    process.env.KITEPROP_API_GET_DATE_QUERY_STYLE?.trim().toLowerCase() || "all";

  if (style === "pair" || style === "from_to") {
    url.searchParams.set("from", since.toISOString());
    url.searchParams.set("to", until.toISOString());
  } else if (style === "none") {
    // Sin query de fechas
  } else {
    url.searchParams.set("from", since.toISOString());
    url.searchParams.set("to", until.toISOString());
    url.searchParams.set("from_date", since.toISOString());
    url.searchParams.set("to_date", until.toISOString());
  }
  return url;
}

export function buildKitepropListUrl(since: Date, until: Date): URL {
  const env = readKitepropImportEnv();
  if (!env.baseUrl) {
    throw new Error("baseUrl requerido");
  }
  const path = resolvePathCandidates()[0];
  return buildKitepropListUrlForPath(env.baseUrl, path, since, until);
}

export function buildKitepropAuthHeaders(): Record<string, string> {
  const env = readKitepropImportEnv();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const keyHeader =
    process.env.KITEPROP_API_KEY_HEADER?.trim() || "X-API-Key";
  if (env.apiKey) {
    headers[keyHeader] = env.apiKey;
  }
  if (env.user && env.password) {
    const basic = Buffer.from(`${env.user}:${env.password}`).toString("base64");
    headers.Authorization = `Basic ${basic}`;
  }
  if (!env.apiKey && (!env.user || !env.password)) {
    throw new Error(
      "Se requiere KITEPROP_API_KEY o KITEPROP_API_USER + KITEPROP_API_PASSWORD",
    );
  }
  return headers;
}

export type KitepropListRequestInfo = {
  url: string;
  method: string;
  headerNames: string[];
};

export function describeKitepropListRequest(
  since: Date,
  until: Date,
): KitepropListRequestInfo {
  const method = (process.env.KITEPROP_API_HTTP_METHOD?.trim() || "GET").toUpperCase();
  const url = buildKitepropListUrl(since, until).toString();
  const h = buildKitepropAuthHeaders();
  return {
    url,
    method,
    headerNames: Object.keys(h),
  };
}

/**
 * Ejecuta GET o POST según KITEPROP_API_HTTP_METHOD.
 * POST: cuerpo JSON con claves KITEPROP_API_POST_FIELD_FROM / KITEPROP_API_POST_FIELD_TO (default from, to).
 */
export async function executeKitepropListHttp(
  since: Date,
  until: Date,
): Promise<Response> {
  const method = (process.env.KITEPROP_API_HTTP_METHOD?.trim() || "GET").toUpperCase();
  const headers = buildKitepropAuthHeaders();
  const env = readKitepropImportEnv();
  if (!env.baseUrl) {
    throw new Error("KITEPROP_API_BASE_URL (o KITEPROP_API_URL) no definido");
  }
  const candidates = resolvePathCandidates();

  for (const candidatePath of candidates) {
    const url = buildKitepropListUrlForPath(env.baseUrl, candidatePath, since, until);
    const kFrom = process.env.KITEPROP_API_POST_FIELD_FROM?.trim() || "from";
    const kTo = process.env.KITEPROP_API_POST_FIELD_TO?.trim() || "to";
    const body: Record<string, string> = {
      [kFrom]: since.toISOString(),
      [kTo]: until.toISOString(),
    };
    const response =
      method === "POST" || method === "PUT"
        ? await fetch(url.toString(), {
            method,
            headers: {
              ...headers,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
          })
        : await fetch(url.toString(), {
            method: "GET",
            headers,
            cache: "no-store",
          });

    // Si el endpoint no existe, probamos el siguiente candidato.
    if (response.status === 404) {
      continue;
    }

    return response;
  }

  return new Response(
    JSON.stringify({
      error:
        "No se encontró endpoint KiteProp para listado. Probá KITEPROP_API_IMPORT_PATH o KITEPROP_API_IMPORT_PATH_CANDIDATES.",
      triedPaths: candidates,
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    },
  );
}
