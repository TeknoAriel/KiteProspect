/**
 * Dispara sincronización manual de inventario KiteProp para la cuenta actual. Solo admin.
 */
import { prisma } from "@kite-prospect/db";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  extractKitepropFeedFromConfig,
  kitepropFeedIsRunnable,
} from "@/domains/auth-tenancy/account-kiteprop-feed-config";
import { syncKitepropFeedForAccount } from "@/domains/properties/sync-kiteprop-feed";
import { recordAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const account = await prisma.account.findFirst({
    where: { id: session.user.accountId },
    select: { id: true, config: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const cfg = extractKitepropFeedFromConfig(account.config);
  if (!kitepropFeedIsRunnable(cfg)) {
    return NextResponse.json(
      { error: "Activá el feed y configurá al menos una URL (JSON o XML) con https." },
      { status: 400 },
    );
  }

  const stats = await syncKitepropFeedForAccount({
    accountId: account.id,
    proppitJsonUrl: cfg.proppitJsonUrl,
    zonapropXmlUrl: cfg.zonapropXmlUrl,
    delistMissing: cfg.delistMissing,
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "account",
      entityId: account.id,
      action: "kiteprop_inventory_synced",
      actorType: "user",
      actorId: session.user.id,
      metadata: { source: "manual", ...stats },
    });
  } catch (e) {
    console.error("[audit] kiteprop_inventory_synced manual", e);
  }

  return NextResponse.json({ ok: true, ...stats });
}
