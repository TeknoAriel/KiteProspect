import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const { id } = await context.params;

  const row = await prisma.branch.findFirst({
    where: { id, accountId: session.user.accountId },
    select: { id: true, name: true, status: true },
  });
  if (!row) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const data: { name?: string; status?: string } = {};

  if (typeof o.name === "string") {
    const name = o.name.trim();
    if (!name || name.length > 200) {
      return NextResponse.json({ error: "name inválido" }, { status: 400 });
    }
    data.name = name;
  }
  if (o.status !== undefined) {
    if (o.status !== "active" && o.status !== "archived") {
      return NextResponse.json({ error: "status debe ser active o archived" }, { status: 400 });
    }
    data.status = o.status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const updated = await prisma.branch.update({
    where: { id: row.id },
    data,
    select: { id: true, name: true, slug: true, status: true },
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "branch",
      entityId: row.id,
      action: "branch_updated",
      actorType: "user",
      actorId: session.user.id,
      metadata: { before: { name: row.name, status: row.status }, after: data },
    });
  } catch (e) {
    console.error("[audit] branch_updated", e);
  }

  return NextResponse.json({ ok: true, branch: updated });
}
