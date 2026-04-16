import { prisma } from "@kite-prospect/db";
import { readKitepropImportEnv } from "./kiteprop-import-env";
import { fetchKitepropLeadsForRange } from "./kiteprop-rest-adapter";
import { ingestKitepropApiRecord } from "./ingest-kiteprop-api-record";

export type RunKitepropLeadSyncResult = {
  runId: string;
  fetchedCount: number;
  importedCount: number;
  skippedCount: number;
  dedupedCount: number;
  errorCount: number;
};

export type RunKitepropLeadSyncOptions = {
  /** 1–90; default desde KITEPROP_IMPORT_LOOKBACK_DAYS */
  lookbackDays?: number;
};

function resolveLookbackDays(
  envDays: number,
  override?: number,
): number {
  if (typeof override === "number" && Number.isFinite(override)) {
    return Math.min(90, Math.max(1, Math.floor(override)));
  }
  return envDays;
}

export async function runKitepropLeadSync(
  accountId: string,
  options?: RunKitepropLeadSyncOptions,
): Promise<RunKitepropLeadSyncResult> {
  const env = readKitepropImportEnv();
  const lookbackDays = resolveLookbackDays(env.lookbackDays, options?.lookbackDays);
  const until = new Date();
  const since = new Date(
    until.getTime() - lookbackDays * 24 * 60 * 60 * 1000,
  );

  const run = await prisma.kitepropLeadSyncRun.create({
    data: {
      accountId,
      status: "running",
      lookbackDays,
    },
  });

  let fetchedCount = 0;
  let importedCount = 0;
  let skippedCount = 0;
  let dedupedCount = 0;
  let errorCount = 0;

  try {
    const fetched = await fetchKitepropLeadsForRange({ since, until });
    if (!fetched.ok) {
      await prisma.kitepropLeadSyncRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          errorCount: 1,
          errorMessage: fetched.error.slice(0, 2000),
          fetchedCount: 0,
        },
      });
      return {
        runId: run.id,
        fetchedCount: 0,
        importedCount: 0,
        skippedCount: 0,
        dedupedCount: 0,
        errorCount: 1,
      };
    }

    fetchedCount = fetched.items.length;

    for (const item of fetched.items) {
      try {
        const r = await ingestKitepropApiRecord(accountId, item);
        if (r.outcome === "imported") importedCount += 1;
        else if (r.outcome === "deduped") dedupedCount += 1;
        else skippedCount += 1;
      } catch {
        errorCount += 1;
      }
    }

    await prisma.kitepropLeadSyncCursor.upsert({
      where: { accountId },
      create: {
        accountId,
        lastSuccessfulEndAt: until,
        opaqueCursor: null,
      },
      update: {
        lastSuccessfulEndAt: until,
      },
    });

    await prisma.kitepropLeadSyncRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        fetchedCount,
        importedCount,
        skippedCount,
        dedupedCount,
        errorCount,
        rawPayloadSnapshot: { since: since.toISOString(), until: until.toISOString() },
      },
    });

    return {
      runId: run.id,
      fetchedCount,
      importedCount,
      skippedCount,
      dedupedCount,
      errorCount,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.kitepropLeadSyncRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        fetchedCount,
        importedCount,
        skippedCount,
        dedupedCount,
        errorCount,
        errorMessage: msg.slice(0, 2000),
      },
    });
    throw e;
  }
}
