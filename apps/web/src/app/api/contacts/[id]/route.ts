/**
 * Actualización de etapas del contacto (F1-E13). Admin / coordinador.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import {
  isCommercialStage,
  isConversationalStage,
} from "@/domains/crm-leads/contact-stage-constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MUTATE_ROLES = new Set(["admin", "coordinator"]);

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.role || !MUTATE_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Solo administradores o coordinadores" }, { status: 403 });
  }

  const { id: contactId } = await context.params;
  const accountId = session.user.accountId;

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, accountId },
    select: {
      id: true,
      commercialStage: true,
      conversationalStage: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const commercialRaw = o.commercialStage;
  const conversationalRaw = o.conversationalStage;

  const patch: { commercialStage?: string; conversationalStage?: string } = {};

  if (commercialRaw !== undefined) {
    if (typeof commercialRaw !== "string" || !isCommercialStage(commercialRaw)) {
      return NextResponse.json({ error: "commercialStage inválido" }, { status: 400 });
    }
    patch.commercialStage = commercialRaw;
  }
  if (conversationalRaw !== undefined) {
    if (typeof conversationalRaw !== "string" || !isConversationalStage(conversationalRaw)) {
      return NextResponse.json({ error: "conversationalStage inválido" }, { status: 400 });
    }
    patch.conversationalStage = conversationalRaw;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const updated = await prisma.contact.update({
    where: { id: contactId },
    data: patch,
    select: {
      id: true,
      commercialStage: true,
      conversationalStage: true,
    },
  });

  await recordAuditEvent({
    accountId,
    entityType: "contact",
    entityId: contactId,
    action: "contact_stages_updated",
    actorId: session.user.id,
    actorType: "user",
    changes: {
      before: {
        commercialStage: existing.commercialStage,
        conversationalStage: existing.conversationalStage,
      },
      after: {
        commercialStage: updated.commercialStage,
        conversationalStage: updated.conversationalStage,
      },
    },
  });

  return NextResponse.json({ ok: true, contact: updated });
}
