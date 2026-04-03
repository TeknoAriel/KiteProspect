/**
 * Cron: sincroniza inventario KiteProp (JSON Proppit + XML OpenNavent) por cuenta.
 * Auth: Authorization: Bearer CRON_SECRET, o cabecera Vercel `x-vercel-cron: 1`.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import {
  applyKitepropFeedSyncStatePatch,
  extractKitepropFeedFromConfig,
  kitepropFeedIsRunnable,
} from "@/domains/auth-tenancy/account-kiteprop-feed-config";
import { syncKitepropFeedForAccount } from "@/domains/properties/sync-kiteprop-feed";
import { recordAuditEvent } from "@/lib/audit";
import { verifyCronBearer } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function authorize(request: NextRequest): { ok: true } | { ok: false; status: number; message: string } {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return { ok: false, status: 503, message: "CRON_SECRET no configurado (ver .env.example)" };
  }

  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const bearerOk = verifyCronBearer(request.headers.get("authorization"), secret);

  if (!isVercelCron && !bearerOk) {
    return { ok: false, status: 401, message: "No autorizado" };
  }

  return { ok: true };
}

export async function GET(request: NextRequest) {
  const auth = authorize(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const accounts = await prisma.account.findMany({
    select: { id: true, config: true },
  });

  const results: {
    accountId: string;
    ran: boolean;
    stats?: Awaited<ReturnType<typeof syncKitepropFeedForAccount>>["stats"];
  }[] = [];

  for (const acc of accounts) {
    const cfg = extractKitepropFeedFromConfig(acc.config);
    if (!kitepropFeedIsRunnable(cfg)) {
      results.push({ accountId: acc.id, ran: false });
      continue;
    }

    const outcome = await syncKitepropFeedForAccount({
      accountId: acc.id,
      proppitJsonUrl: cfg.proppitJsonUrl,
      zonapropXmlUrl: cfg.zonapropXmlUrl,
      delistMissing: cfg.delistMissing,
      removalPolicy: cfg.removalPolicy,
      skipManifestIfUnchanged: cfg.skipManifestIfUnchanged,
      lastMergedManifestSha256: cfg.lastMergedManifestSha256,
      lastProppitEtag: cfg.lastProppitEtag,
      lastProppitLastModified: cfg.lastProppitLastModified,
      lastXmlEtag: cfg.lastXmlEtag,
      lastXmlLastModified: cfg.lastXmlLastModified,
    });

    if (Object.keys(outcome.syncStatePatch).length > 0) {
      await prisma.account.update({
        where: { id: acc.id },
        data: { config: applyKitepropFeedSyncStatePatch(acc.config, outcome.syncStatePatch) },
      });
    }

    results.push({ accountId: acc.id, ran: true, stats: outcome.stats });

    try {
      await recordAuditEvent({
        accountId: acc.id,
        entityType: "account",
        entityId: acc.id,
        action: "kiteprop_inventory_synced",
        actorType: "system",
        metadata: { source: "cron", ...outcome.stats },
      });
    } catch (e) {
      console.error("[audit] kiteprop_inventory_synced", e);
    }
  }

  const ranCount = results.filter((r) => r.ran).length;
  return NextResponse.json({ ok: true, accounts: results.length, ranCount, results });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
