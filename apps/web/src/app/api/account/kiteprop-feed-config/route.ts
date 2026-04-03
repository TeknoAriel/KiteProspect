/**
 * Configuración de feeds KiteProp (JSON + XML) en Account.config.kitepropFeed. Solo admin.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import {
  extractKitepropFeedFromConfig,
  mergeKitepropFeedIntoAccountConfig,
} from "@/domains/auth-tenancy/account-kiteprop-feed-config";
import { isAllowedInventoryFeedUrl } from "@/lib/inventory-feed-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
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

  const kiteprop = extractKitepropFeedFromConfig(account.config);
  return NextResponse.json({ ok: true, ...kiteprop });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  let body: {
    enabled?: boolean;
    proppitJsonUrl?: string | null;
    zonapropXmlUrl?: string | null;
    delistMissing?: boolean;
    removalPolicy?: "withdraw" | "delete";
    skipManifestIfUnchanged?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const account = await prisma.account.findFirst({
    where: { id: session.user.accountId },
    select: { id: true, config: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const jsonUrl =
    body.proppitJsonUrl !== undefined ? (body.proppitJsonUrl ?? "").trim() : undefined;
  const xmlUrl =
    body.zonapropXmlUrl !== undefined ? (body.zonapropXmlUrl ?? "").trim() : undefined;

  if (jsonUrl !== undefined && jsonUrl && !isAllowedInventoryFeedUrl(jsonUrl)) {
    return NextResponse.json(
      { error: "proppitJsonUrl debe ser https (o http solo en desarrollo)" },
      { status: 400 },
    );
  }
  if (xmlUrl !== undefined && xmlUrl && !isAllowedInventoryFeedUrl(xmlUrl)) {
    return NextResponse.json(
      { error: "zonapropXmlUrl debe ser https (o http solo en desarrollo)" },
      { status: 400 },
    );
  }

  if (
    body.removalPolicy !== undefined &&
    body.removalPolicy !== "withdraw" &&
    body.removalPolicy !== "delete"
  ) {
    return NextResponse.json({ error: "removalPolicy inválido" }, { status: 400 });
  }

  const nextConfig = mergeKitepropFeedIntoAccountConfig(account.config, {
    enabled: body.enabled,
    proppitJsonUrl: body.proppitJsonUrl !== undefined ? body.proppitJsonUrl : undefined,
    zonapropXmlUrl: body.zonapropXmlUrl !== undefined ? body.zonapropXmlUrl : undefined,
    delistMissing: body.delistMissing,
    removalPolicy: body.removalPolicy,
    skipManifestIfUnchanged: body.skipManifestIfUnchanged,
  });

  const updated = await prisma.account.update({
    where: { id: account.id },
    data: { config: nextConfig },
    select: { id: true, config: true },
  });

  const kiteprop = extractKitepropFeedFromConfig(updated.config);

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "account",
      entityId: updated.id,
      action: "account_kiteprop_feed_config_updated",
      actorType: "user",
      actorId: session.user.id,
      metadata: kiteprop,
    });
  } catch (e) {
    console.error("[audit] account_kiteprop_feed_config_updated", e);
  }

  return NextResponse.json({ ok: true, ...kiteprop });
}
