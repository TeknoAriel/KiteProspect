/**
 * Reasignación de contacto a asesor (F1-E13). Solo admin / coordinador.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { emitAccountWebhooks } from "@/domains/integrations/services/emit-account-webhooks";

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

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, accountId },
    select: { id: true },
  });
  if (!contact) {
    return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const advisorId = typeof o.advisorId === "string" ? o.advisorId.trim() : "";
  if (!advisorId) {
    return NextResponse.json({ error: "advisorId requerido" }, { status: 400 });
  }

  const advisor = await prisma.advisor.findFirst({
    where: { id: advisorId, accountId, status: "active" },
    select: { id: true, name: true },
  });
  if (!advisor) {
    return NextResponse.json({ error: "Asesor no válido para esta cuenta" }, { status: 400 });
  }

  const currentActive = await prisma.assignment.findMany({
    where: { contactId, status: "active" },
    select: { id: true, advisorId: true },
  });

  const same = currentActive.length === 1 && currentActive[0]!.advisorId === advisorId;
  if (same) {
    return NextResponse.json({ ok: true, assignment: { advisorId, unchanged: true } });
  }

  await prisma.$transaction(async (tx) => {
    for (const a of currentActive) {
      await tx.assignment.update({
        where: { id: a.id },
        data: { status: "transferred" },
      });
    }
    await tx.assignment.create({
      data: {
        contactId,
        advisorId,
        assignedBy: session.user.id,
        reason: "reassigned_from_ui",
        status: "active",
      },
    });
  });

  await recordAuditEvent({
    accountId,
    entityType: "contact",
    entityId: contactId,
    action: "contact_assigned",
    actorId: session.user.id,
    actorType: "user",
    metadata: { advisorId, advisorName: advisor.name },
  });

  void emitAccountWebhooks({
    accountId,
    event: "contact.assignment_changed",
    data: {
      contactId,
      advisorId,
      advisorName: advisor.name,
    },
  }).catch((e) => console.error("[webhook] contact.assignment_changed", e));

  return NextResponse.json({ ok: true, assignment: { advisorId, advisorName: advisor.name } });
}
