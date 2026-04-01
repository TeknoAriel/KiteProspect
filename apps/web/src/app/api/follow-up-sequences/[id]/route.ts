/**
 * Pausar / reanudar secuencia de seguimiento (F1-E12). Solo admin / coordinador.
 * El cron solo procesa `status: active`.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";

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

  const { id: sequenceId } = await context.params;
  const accountId = session.user.accountId;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const status = typeof o.status === "string" ? o.status.trim() : "";
  if (status !== "paused" && status !== "active") {
    return NextResponse.json({ error: "status debe ser paused o active" }, { status: 400 });
  }

  const seq = await prisma.followUpSequence.findFirst({
    where: { id: sequenceId, contact: { accountId } },
    include: {
      contact: { select: { id: true } },
      plan: { select: { name: true } },
    },
  });

  if (!seq) {
    return NextResponse.json({ error: "Secuencia no encontrada" }, { status: 404 });
  }

  if (status === "paused" && seq.status !== "active") {
    return NextResponse.json(
      { error: "Solo se pausan secuencias en estado active" },
      { status: 409 },
    );
  }
  if (status === "active" && seq.status !== "paused") {
    return NextResponse.json(
      { error: "Solo se reanudan secuencias en pausa" },
      { status: 409 },
    );
  }

  const updated = await prisma.followUpSequence.update({
    where: { id: sequenceId },
    data: { status },
  });

  await recordAuditEvent({
    accountId,
    entityType: "follow_up_sequence",
    entityId: sequenceId,
    action: status === "paused" ? "follow_up_sequence_paused" : "follow_up_sequence_resumed",
    actorId: session.user.id,
    actorType: "user",
    metadata: {
      contactId: seq.contact.id,
      planName: seq.plan.name,
      previousStatus: seq.status,
    },
  });

  return NextResponse.json({
    ok: true,
    sequence: { id: updated.id, status: updated.status },
  });
}
