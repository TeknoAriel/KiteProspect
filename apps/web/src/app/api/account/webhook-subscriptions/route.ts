/**
 * Suscripciones a webhooks salientes (F3-E3). Solo admin.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { generateWebhookSigningSecret } from "@/domains/integrations/services/generate-webhook-signing-secret";
import { isAllowedOutboundWebhookUrl } from "@/domains/integrations/services/webhook-url";
import {
  parseWebhookEventsInput,
  WEBHOOK_EVENT_TYPES,
} from "@/domains/integrations/services/webhook-event-types";

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

  const rows = await prisma.webhookSubscription.findMany({
    where: { accountId: session.user.accountId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      url: true,
      events: true,
      createdAt: true,
      revokedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    subscriptions: rows.map((r) => ({
      ...r,
      events: r.events,
      urlHint:
        r.url.length > 64 ? `${r.url.slice(0, 48)}…${r.url.slice(-12)}` : r.url,
    })),
    eventTypes: [...WEBHOOK_EVENT_TYPES],
  });
}

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
    body = {};
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const url = typeof o.url === "string" ? o.url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "url requerida (https…)" }, { status: 400 });
  }
  if (!isAllowedOutboundWebhookUrl(url)) {
    return NextResponse.json(
      {
        error:
          "URL no válida: usá https en producción o http solo para localhost (pruebas).",
      },
      { status: 400 },
    );
  }

  const eventsParsed = parseWebhookEventsInput(o.events);
  if (eventsParsed === null) {
    return NextResponse.json(
      { error: "events debe ser un array con al menos un evento permitido" },
      { status: 400 },
    );
  }

  const signingSecret = generateWebhookSigningSecret();

  const row = await prisma.webhookSubscription.create({
    data: {
      accountId: session.user.accountId,
      name: name || null,
      url,
      signingSecret,
      events: eventsParsed,
    },
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "webhook_subscription",
      entityId: row.id,
      action: "webhook_subscription_created",
      actorType: "user",
      actorId: session.user.id,
      metadata: { name: name || null, urlHint: url.slice(0, 80) },
    });
  } catch (e) {
    console.error("[audit] webhook_subscription_created", e);
  }

  return NextResponse.json({
    ok: true,
    id: row.id,
    signingSecret,
    message:
      "Guardá el secreto ahora para verificar la cabecera X-Kite-Signature en tu endpoint; no se volverá a mostrar.",
  });
}
