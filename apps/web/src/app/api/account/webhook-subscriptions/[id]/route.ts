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

  const row = await prisma.webhookSubscription.findFirst({
    where: { id, accountId: session.user.accountId },
    select: { id: true, revokedAt: true },
  });
  if (!row) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (row.revokedAt) {
    return NextResponse.json({ ok: true, alreadyRevoked: true });
  }

  await prisma.webhookSubscription.update({
    where: { id: row.id },
    data: { revokedAt: new Date() },
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "webhook_subscription",
      entityId: row.id,
      action: "webhook_subscription_revoked",
      actorType: "user",
      actorId: session.user.id,
      metadata: {},
    });
  } catch (e) {
    console.error("[audit] webhook_subscription_revoked", e);
  }

  return NextResponse.json({ ok: true });
}
