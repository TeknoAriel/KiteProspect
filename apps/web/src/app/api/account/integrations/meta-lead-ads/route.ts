/**
 * Alta de Integration Meta Lead Ads (solo admin del tenant). F2-E6 / L10.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { findActiveMetaLeadAdsPageConflict } from "@/domains/integrations/find-meta-lead-page-conflict";
import { normalizeMetaLeadPageId } from "@/domains/integrations/meta-lead-page-id";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const pageIdRaw =
    body !== null && typeof body === "object" && !Array.isArray(body)
      ? String((body as { pageId?: unknown }).pageId ?? "").trim()
      : "";
  const pageId = normalizeMetaLeadPageId(pageIdRaw);
  if (!pageId) {
    return NextResponse.json(
      { error: "pageId inválido: usá el ID numérico de la página de Meta (6–32 dígitos)." },
      { status: 400 },
    );
  }

  const conflict = await findActiveMetaLeadAdsPageConflict(prisma, pageId);
  if (conflict) {
    return NextResponse.json(
      {
        error:
          conflict.accountId === session.user.accountId
            ? "Ya existe una integración activa con ese pageId."
            : "Ese pageId ya está en uso por otra cuenta.",
      },
      { status: 409 },
    );
  }

  const created = await prisma.integration.create({
    data: {
      accountId: session.user.accountId,
      type: "meta_lead_ads",
      provider: "meta",
      status: "active",
      config: { pageId },
    },
    select: { id: true },
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "integration",
      entityId: created.id,
      action: "integration_meta_lead_ads_created",
      actorType: "user",
      actorId: session.user.id,
      metadata: { pageId },
    });
  } catch (e) {
    console.error("[audit] integration_meta_lead_ads_created", e);
  }

  return NextResponse.json({ ok: true, id: created.id });
}
