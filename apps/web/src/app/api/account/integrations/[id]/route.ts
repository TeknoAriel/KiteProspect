/**
 * Actualización de Integration del tenant (Meta Lead Ads: pageId / estado). Solo admin. L10.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { findActiveMetaLeadAdsPageConflict } from "@/domains/integrations/find-meta-lead-page-conflict";
import { normalizeMetaLeadPageId, readPageIdFromIntegrationConfig } from "@/domains/integrations/meta-lead-page-id";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUSES = new Set(["active", "paused"]);

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const { id: integrationId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const b = body as { pageId?: unknown; status?: unknown };
  const hasPageId = "pageId" in b;
  const hasStatus = "status" in b;

  if (!hasPageId && !hasStatus) {
    return NextResponse.json({ error: "Indicá pageId y/o status." }, { status: 400 });
  }

  const existing = await prisma.integration.findFirst({
    where: { id: integrationId, accountId: session.user.accountId },
    select: { id: true, type: true, config: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Integración no encontrada" }, { status: 404 });
  }

  if (existing.type !== "meta_lead_ads") {
    return NextResponse.json({ error: "Solo se edita Meta Lead Ads desde esta ruta." }, { status: 400 });
  }

  const existingPageId = readPageIdFromIntegrationConfig(existing.config);
  let nextPageId: string;
  if (hasPageId) {
    const raw = String(b.pageId ?? "").trim();
    const normalized = normalizeMetaLeadPageId(raw);
    if (!normalized) {
      return NextResponse.json(
        { error: "pageId inválido: ID numérico de página Meta (6–32 dígitos)." },
        { status: 400 },
      );
    }
    const conflict = await findActiveMetaLeadAdsPageConflict(prisma, normalized, integrationId);
    if (conflict) {
      return NextResponse.json(
        {
          error:
            conflict.accountId === session.user.accountId
              ? "Ya existe otra integración activa con ese pageId."
              : "Ese pageId ya está en uso por otra cuenta.",
        },
        { status: 409 },
      );
    }
    nextPageId = normalized;
  } else if (existingPageId) {
    nextPageId = existingPageId;
  } else {
    return NextResponse.json(
      { error: "La integración no tiene pageId válido; enviá pageId en el cuerpo." },
      { status: 400 },
    );
  }

  let nextStatus = existing.status;
  if (hasStatus) {
    const s = String(b.status ?? "").trim();
    if (!STATUSES.has(s)) {
      return NextResponse.json({ error: "status debe ser active o paused." }, { status: 400 });
    }
    nextStatus = s;
  }

  await prisma.integration.update({
    where: { id: integrationId },
    data: {
      config: { pageId: nextPageId },
      status: nextStatus,
    },
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "integration",
      entityId: integrationId,
      action: "integration_meta_lead_ads_updated",
      actorType: "user",
      actorId: session.user.id,
      metadata: { pageId: nextPageId, status: nextStatus },
    });
  } catch (e) {
    console.error("[audit] integration_meta_lead_ads_updated", e);
  }

  return NextResponse.json({ ok: true });
}
