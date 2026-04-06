/**
 * Revocar API key de captura. Solo admin.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const { id } = await context.params;

  const existing = await prisma.captureApiKey.findFirst({
    where: { id, accountId: session.user.accountId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Clave no encontrada" }, { status: 404 });
  }
  if (existing.revokedAt) {
    return NextResponse.json({ error: "Ya estaba revocada" }, { status: 409 });
  }

  await prisma.captureApiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "capture_api_key",
      entityId: id,
      action: "capture_api_key_revoked",
      actorType: "user",
      actorId: session.user.id,
    });
  } catch (e) {
    console.error("[audit] capture_api_key_revoked", e);
  }

  return NextResponse.json({ ok: true });
}
