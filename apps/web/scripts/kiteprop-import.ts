/**
 * Import incremental desde KiteProp REST (últimos N días).
 * Uso desde la raíz del monorepo:
 *   npm run kiteprop:import:last-week
 *   npm run kiteprop:import -- --days=14
 *
 * Requiere .env con DATABASE_URL, KITEPROP_API_*, y opcional KITEPROP_IMPORT_ACCOUNT_ID o KITEPROP_IMPORT_ACCOUNT_SLUG.
 */
import { prisma } from "@kite-prospect/db";
import { validateKitepropApiForHttpImport } from "../src/domains/integrations/kiteprop-rest/kiteprop-api-env";
import { runKitepropLeadSync } from "../src/domains/integrations/kiteprop-rest/run-kiteprop-lead-sync";

function parseDays(argv: string[]): number | undefined {
  for (const a of argv) {
    if (a.startsWith("--days=")) {
      const n = Number.parseInt(a.slice("--days=".length), 10);
      if (Number.isFinite(n) && n >= 1 && n <= 90) return n;
    }
  }
  return undefined;
}

async function resolveAccountId(): Promise<string | null> {
  const explicit = process.env.KITEPROP_IMPORT_ACCOUNT_ID?.trim();
  if (explicit) return explicit;
  const slug = process.env.KITEPROP_IMPORT_ACCOUNT_SLUG?.trim();
  if (slug) {
    const acc = await prisma.account.findUnique({
      where: { slug },
      select: { id: true },
    });
    return acc?.id ?? null;
  }
  const first = await prisma.account.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return first?.id ?? null;
}

async function main() {
  const days = parseDays(process.argv.slice(2));
  const accountId = await resolveAccountId();
  if (!accountId) {
    console.error(
      "No hay cuenta: definí KITEPROP_IMPORT_ACCOUNT_ID o KITEPROP_IMPORT_ACCOUNT_SLUG, o cargá seed.",
    );
    process.exit(1);
  }

  const slugInfo = process.env.KITEPROP_IMPORT_ACCOUNT_SLUG?.trim()
    ? `slug=${process.env.KITEPROP_IMPORT_ACCOUNT_SLUG}`
    : "";
  console.log("Cuenta:", accountId, slugInfo);
  console.log("Lookback días:", days ?? "(env KITEPROP_IMPORT_LOOKBACK_DAYS)");
  const fixture = process.env.KITEPROP_IMPORT_LIST_FIXTURE?.trim();
  if (fixture) {
    console.log("Modo fixture (sin HTTP):", fixture);
  } else {
    const check = validateKitepropApiForHttpImport();
    if (!check.ok) {
      console.error("Faltan variables para llamar a la API real:\n");
      for (const err of check.errors) {
        console.error(`  - ${err}`);
      }
      console.error(
        "\nConfigurá .env y ejecutá: npm run kiteprop:check-api\nGuía: docs/kiteprop-api-import-setup.md",
      );
      process.exit(1);
    }
  }

  const result = await runKitepropLeadSync(accountId, { lookbackDays: days });
  console.log(JSON.stringify(result, null, 2));

  if (result.errorCount > 0 || result.fetchedCount === 0) {
    const run = await prisma.kitepropLeadSyncRun.findUnique({
      where: { id: result.runId },
      select: { status: true, errorMessage: true },
    });
    if (run?.errorMessage) {
      console.error("Detalle sync:", run.errorMessage);
    }
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
