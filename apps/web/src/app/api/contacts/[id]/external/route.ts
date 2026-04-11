/**
 * ID en CRM externo (`Contact.externalId`). F3-E1 slice mínimo.
 * - **GET:** lectura de vínculo + etapas (misma auth que PATCH; secreto global → `accountId` en query).
 * - **PATCH:** sesión admin/coordinador o captura (`Authorization` / `X-Capture-Secret`);
 *   secreto global requiere `accountId` en el **cuerpo** JSON.
 */
import { Prisma, prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { findContactExternalIdConflict } from "@/domains/crm-leads/contact-external-id-conflict";
import {
  captureAuthConfiguredForAccount,
  extractCaptureToken,
  verifyGlobalCaptureSecret,
  verifyTenantCaptureKey,
} from "@/domains/capture/services/verify-capture-auth";
import { normalizeContactExternalId } from "@/domains/crm-leads/contact-external-id";
import { getClientIpFromRequest } from "@/lib/client-ip";
import { allowRateLimit, getCaptureRateLimitConfig } from "@/lib/rate-limit-memory";
import { emitAccountWebhooks } from "@/domains/integrations/services/emit-account-webhooks";
import { logStructured } from "@/lib/structured-log";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MUTATE_ROLES = new Set(["admin", "coordinator"]);

const EXTERNAL_READ_SELECT = {
  id: true,
  externalId: true,
  commercialStage: true,
  conversationalStage: true,
  branchId: true,
} as const;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: contactId } = await context.params;

  const session = await auth();
  if (session?.user?.accountId && session.user.role && MUTATE_ROLES.has(session.user.role)) {
    const row = await prisma.contact.findFirst({
      where: { id: contactId, accountId: session.user.accountId },
      select: EXTERNAL_READ_SELECT,
    });
    if (!row) {
      return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
    }
    logStructured("contact_external_read", {
      accountId: session.user.accountId,
      contactId,
      via: "session",
    });
    return NextResponse.json({ ok: true, contact: row });
  }

  const ip = getClientIpFromRequest(request);
  if (!allowRateLimit(`contact-external-api:${ip}`)) {
    const { windowMs } = getCaptureRateLimitConfig();
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) },
      },
    );
  }

  const token = extractCaptureToken(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId },
    select: { ...EXTERNAL_READ_SELECT, accountId: true },
  });
  if (!contact) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  const configured = await captureAuthConfiguredForAccount(contact.accountId);
  if (!configured) {
    return NextResponse.json(
      {
        error:
          "Captura no configurada: definí CAPTURE_API_SECRET en el entorno o creá una API key en la cuenta (admin → captura).",
      },
      { status: 503 },
    );
  }

  const okTenant = await verifyTenantCaptureKey(token, contact.accountId);
  const okGlobal = verifyGlobalCaptureSecret(token);
  let ok = okTenant;
  if (okGlobal) {
    const aid = new URL(request.url).searchParams.get("accountId")?.trim() ?? "";
    if (aid && aid === contact.accountId) {
      ok = true;
    } else {
      return NextResponse.json(
        { error: "Con secreto global, incluí accountId en la query (UUID de la cuenta del contacto)." },
        { status: 401 },
      );
    }
  }

  if (!ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  logStructured("contact_external_read", {
    accountId: contact.accountId,
    contactId,
    via: "capture_auth",
  });

  return NextResponse.json({
    ok: true,
    contact: {
      id: contact.id,
      externalId: contact.externalId,
      commercialStage: contact.commercialStage,
      conversationalStage: contact.conversationalStage,
      branchId: contact.branchId,
    },
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: contactId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const normalized = normalizeContactExternalId(o.externalId);
  if (!normalized.ok) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }
  const nextExternalId = normalized.value;

  const session = await auth();
  if (session?.user?.accountId && session.user.role && MUTATE_ROLES.has(session.user.role)) {
    return patchWithSession({
      contactId,
      accountId: session.user.accountId,
      userId: session.user.id,
      nextExternalId,
    });
  }

  const ip = getClientIpFromRequest(request);
  if (!allowRateLimit(`contact-external-api:${ip}`)) {
    const { windowMs } = getCaptureRateLimitConfig();
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) },
      },
    );
  }

  const token = extractCaptureToken(request);
  if (!token) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const contact = await prisma.contact.findFirst({
    where: { id: contactId },
    select: { id: true, accountId: true, externalId: true },
  });
  if (!contact) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  const configured = await captureAuthConfiguredForAccount(contact.accountId);
  if (!configured) {
    return NextResponse.json(
      {
        error:
          "Captura no configurada: definí CAPTURE_API_SECRET en el entorno o creá una API key en la cuenta (admin → captura).",
      },
      { status: 503 },
    );
  }

  const okTenant = await verifyTenantCaptureKey(token, contact.accountId);
  const okGlobal = verifyGlobalCaptureSecret(token);
  let ok = okTenant;
  if (okGlobal) {
    const aid = typeof o.accountId === "string" ? o.accountId.trim() : "";
    if (aid && aid === contact.accountId) {
      ok = true;
    } else {
      return NextResponse.json(
        { error: "Con secreto global, incluí accountId en el cuerpo (UUID de la cuenta del contacto)." },
        { status: 401 },
      );
    }
  }

  if (!ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (contact.externalId === nextExternalId) {
    return NextResponse.json({
      ok: true,
      contact: { id: contact.id, externalId: nextExternalId, unchanged: true },
    });
  }

  const conflict = await findContactExternalIdConflict({
    accountId: contact.accountId,
    contactId,
    nextExternalId,
  });
  if (conflict) {
    return NextResponse.json(
      {
        error: "Ya existe otro contacto con ese externalId en la cuenta.",
        conflictContactId: conflict.id,
      },
      { status: 409 },
    );
  }

  try {
    await prisma.contact.update({
      where: { id: contactId },
      data: { externalId: nextExternalId },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Conflicto de ID externo (duplicado en la cuenta)." },
        { status: 409 },
      );
    }
    throw e;
  }

  await recordAuditEvent({
    accountId: contact.accountId,
    entityType: "contact",
    entityId: contactId,
    action: "contact_external_id_updated",
    actorType: "integration",
    changes: {
      before: { externalId: contact.externalId },
      after: { externalId: nextExternalId },
    },
  });

  logStructured("contact_external_id_patched", {
    accountId: contact.accountId,
    contactId,
    via: "capture_auth",
  });

  void emitAccountWebhooks({
    accountId: contact.accountId,
    event: "contact.external_id_updated",
    data: {
      contactId,
      externalIdBefore: contact.externalId,
      externalIdAfter: nextExternalId,
    },
  }).catch((e) => console.error("[webhook] contact.external_id_updated", e));

  return NextResponse.json({
    ok: true,
    contact: { id: contact.id, externalId: nextExternalId },
  });
}

async function patchWithSession(input: {
  contactId: string;
  accountId: string;
  userId: string;
  nextExternalId: string | null;
}) {
  const { contactId, accountId, userId, nextExternalId } = input;

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, accountId },
    select: { id: true, externalId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  if (existing.externalId === nextExternalId) {
    return NextResponse.json({
      ok: true,
      contact: { id: existing.id, externalId: nextExternalId, unchanged: true },
    });
  }

  const conflict = await findContactExternalIdConflict({
    accountId,
    contactId,
    nextExternalId,
  });
  if (conflict) {
    return NextResponse.json(
      {
        error: "Ya existe otro contacto con ese externalId en la cuenta.",
        conflictContactId: conflict.id,
      },
      { status: 409 },
    );
  }

  try {
    await prisma.contact.update({
      where: { id: contactId },
      data: { externalId: nextExternalId },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Conflicto de ID externo (duplicado en la cuenta)." },
        { status: 409 },
      );
    }
    throw e;
  }

  await recordAuditEvent({
    accountId,
    entityType: "contact",
    entityId: contactId,
    action: "contact_external_id_updated",
    actorId: userId,
    actorType: "user",
    changes: {
      before: { externalId: existing.externalId },
      after: { externalId: nextExternalId },
    },
  });

  logStructured("contact_external_id_patched", {
    accountId,
    contactId,
    via: "session",
  });

  void emitAccountWebhooks({
    accountId,
    event: "contact.external_id_updated",
    data: {
      contactId,
      externalIdBefore: existing.externalId,
      externalIdAfter: nextExternalId,
    },
  }).catch((e) => console.error("[webhook] contact.external_id_updated", e));

  return NextResponse.json({
    ok: true,
    contact: { id: contactId, externalId: nextExternalId },
  });
}
