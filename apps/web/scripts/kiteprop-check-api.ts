/**
 * Diagnóstico de conectividad y forma de respuesta hacia KiteProp API (sin imprimir secretos).
 * Uso: npm run kiteprop:check-api
 */
import {
  printKitepropApiEnvReportLines,
  validateKitepropApiForHttpImport,
} from "../src/domains/integrations/kiteprop-rest/kiteprop-api-env";
import {
  describeKitepropListRequest,
  executeKitepropListHttp,
} from "../src/domains/integrations/kiteprop-rest/kiteprop-api-list-request";

function parseDays(argv: string[]): number {
  for (const a of argv) {
    if (a.startsWith("--days=")) {
      const n = Number.parseInt(a.slice("--days=".length), 10);
      if (Number.isFinite(n) && n >= 1 && n <= 90) return n;
    }
  }
  return 7;
}

function summarizeJsonShape(json: unknown, depth = 0): string {
  if (depth > 4) return "(profundidad máxima)";
  if (json === null || json === undefined) return String(json);
  if (Array.isArray(json)) {
    if (json.length === 0) return "[]";
    const first = json[0];
    if (first !== null && typeof first === "object" && !Array.isArray(first)) {
      return `array(len=${json.length}) → primer elemento: object keys [${Object.keys(first).join(", ")}]`;
    }
    return `array(len=${json.length}, elementos no-object)`;
  }
  if (typeof json === "object") {
    return `object keys [${Object.keys(json as object).join(", ")}]`;
  }
  return typeof json;
}

async function main() {
  const days = parseDays(process.argv.slice(2));
  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);

  console.log("=== KiteProp API — diagnóstico ===\n");
  console.log(`Ventana de prueba: últimos ${days} días (since=${since.toISOString()} until=${until.toISOString()})\n`);

  if (process.env.KITEPROP_IMPORT_LIST_FIXTURE?.trim()) {
    console.error(
      "KITEPROP_IMPORT_LIST_FIXTURE está definido: el import usa fixture local y no llama a la API.",
    );
    console.error("Quitá esa variable del entorno para probar HTTP real.\n");
    process.exit(2);
  }

  for (const line of printKitepropApiEnvReportLines()) {
    console.log(line);
  }
  console.log("");

  const v = validateKitepropApiForHttpImport();
  if (!v.ok) {
    console.error("Abort: faltan variables obligatorias:\n");
    for (const e of v.errors) {
      console.error(`  - ${e}`);
    }
    console.error(
      "\nCompletá .env según la documentación acordada con KiteProp (URL base + path + auth).",
    );
    console.error("Guía: docs/kiteprop-api-import-setup.md\n");
    process.exit(1);
  }

  let info: ReturnType<typeof describeKitepropListRequest>;
  try {
    info = describeKitepropListRequest(since, until);
  } catch (e) {
    console.error("Error armando request:", e instanceof Error ? e.message : e);
    process.exit(1);
  }

  console.log("Request planificado:");
  console.log(`  Método: ${info.method}`);
  console.log(`  URL: ${info.url}`);
  console.log(`  Cabeceras (nombres): ${info.headerNames.join(", ")}`);
  if (info.method === "POST" || info.method === "PUT") {
    const kf = process.env.KITEPROP_API_POST_FIELD_FROM?.trim() || "from";
    const kt = process.env.KITEPROP_API_POST_FIELD_TO?.trim() || "to";
    console.log(
      `  Body JSON (solo claves, valores = ISO since/until): { "${kf}": "…", "${kt}": "…" }`,
    );
  }
  console.log("");

  let res: Response;
  try {
    res = await executeKitepropListHttp(since, until);
  } catch (e) {
    console.error("Error de red:", e instanceof Error ? e.message : e);
    process.exit(3);
  }

  const wwwAuth = res.headers.get("www-authenticate");
  console.log("Respuesta HTTP:");
  console.log(`  status: ${res.status} ${res.statusText || ""}`);
  console.log(
    `  autenticación (heurística): ${res.status === 401 || res.status === 403 ? "rechazada o insuficiente" : res.ok ? "aceptada para esta petición" : "ver cuerpo / status"}`,
  );
  if (wwwAuth) {
    console.log(`  www-authenticate: ${wwwAuth.slice(0, 120)}`);
  }
  console.log("");

  const text = await res.text();
  if (!text.trim()) {
    console.log("Cuerpo: (vacío)");
    process.exit(res.ok ? 0 : 4);
  }

  let json: unknown;
  try {
    json = JSON.parse(text) as unknown;
  } catch {
    console.log("Cuerpo no es JSON. Primeros 400 caracteres:");
    console.log(text.slice(0, 400));
    process.exit(res.ok ? 0 : 4);
  }

  console.log("Shape JSON (sin valores sensibles):");
  console.log(`  ${summarizeJsonShape(json)}`);
  console.log("");
  console.log(
    "Si el listado no está bajo data | leads | items | results | records, ampliá extractItems en kiteprop-rest-adapter.ts con una muestra real.",
  );
  console.log(
    "Si los ítems no normalizan, actualizá normalize-kiteprop-api-item.ts con el payload real.",
  );

  process.exit(res.ok ? 0 : 4);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
