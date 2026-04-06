/**
 * Pausar / reanudar secuencia; editar rama de matriz (fijar / liberar). Solo admin / coordinador.
 * El cron solo procesa `status: active` y respeta `matrixBranchLocked` (L12).
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { isFollowUpBranchKey } from "@/domains/core-prospeccion/follow-up-branches";

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
  const hasStatus = typeof o.status === "string" && o.status.trim() !== "";
  const hasBranch = "matrixBranchKey" in o || "matrixBranchLocked" in o;

  if (!hasStatus && !hasBranch) {
    return NextResponse.json(
      { error: "Indicá status (paused/active) y/o matrixBranchKey / matrixBranchLocked." },
      { status: 400 },
    );
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

  if (hasBranch && !["active", "paused"].includes(seq.status)) {
    return NextResponse.json(
      { error: "Solo se edita rama en seguimiento activo o en pausa." },
      { status: 409 },
    );
  }

  let nextStatus = seq.status;
  if (hasStatus) {
    const status = o.status as string;
    if (status !== "paused" && status !== "active") {
      return NextResponse.json({ error: "status debe ser paused o active" }, { status: 400 });
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
    nextStatus = status;
  }

  let nextKey = seq.matrixBranchKey;
  let nextLocked = seq.matrixBranchLocked;
  if (hasBranch) {
    const keyField = o.matrixBranchKey;
    const hasKey = typeof keyField === "string";
    const hasLockedFlag = typeof o.matrixBranchLocked === "boolean";

    if (hasKey) {
      const raw = keyField.trim();
      if (raw === "") {
        nextKey = null;
        nextLocked = hasLockedFlag ? Boolean(o.matrixBranchLocked) : false;
      } else {
        if (!isFollowUpBranchKey(raw)) {
          return NextResponse.json({ error: "matrixBranchKey no es una rama válida." }, { status: 400 });
        }
        nextKey = raw;
        nextLocked = hasLockedFlag ? Boolean(o.matrixBranchLocked) : true;
      }
    } else if (hasLockedFlag) {
      nextLocked = Boolean(o.matrixBranchLocked);
      if (nextLocked && !nextKey) {
        return NextResponse.json(
          {
            error:
              "No se puede fijar rama sin valor: enviá matrixBranchKey con una rama válida o desbloqueá primero.",
          },
          { status: 400 },
        );
      }
    }

    if (nextLocked && !nextKey) {
      return NextResponse.json(
        { error: "Rama fijada requiere matrixBranchKey no vacío." },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.followUpSequence.update({
    where: { id: sequenceId },
    data: {
      ...(hasStatus ? { status: nextStatus } : {}),
      ...(hasBranch ? { matrixBranchKey: nextKey, matrixBranchLocked: nextLocked } : {}),
    },
  });

  if (hasStatus) {
    await recordAuditEvent({
      accountId,
      entityType: "follow_up_sequence",
      entityId: sequenceId,
      action: nextStatus === "paused" ? "follow_up_sequence_paused" : "follow_up_sequence_resumed",
      actorId: session.user.id,
      actorType: "user",
      metadata: {
        contactId: seq.contact.id,
        planName: seq.plan.name,
        previousStatus: seq.status,
      },
    });
  }

  if (hasBranch) {
    await recordAuditEvent({
      accountId,
      entityType: "follow_up_sequence",
      entityId: sequenceId,
      action: "follow_up_matrix_branch_manual_update",
      actorId: session.user.id,
      actorType: "user",
      metadata: {
        contactId: seq.contact.id,
        planName: seq.plan.name,
        matrixBranchKey: nextKey,
        matrixBranchLocked: nextLocked,
        previousKey: seq.matrixBranchKey,
        previousLocked: seq.matrixBranchLocked,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    sequence: {
      id: updated.id,
      status: updated.status,
      matrixBranchKey: updated.matrixBranchKey,
      matrixBranchLocked: updated.matrixBranchLocked,
    },
  });
}
