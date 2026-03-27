import bcrypt from "bcryptjs";
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { serializeUser } from "@/domains/users/user-serialization";
import { parseUserPatchBody } from "@/domains/users/validate-user-payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MUTATE_ROLES = new Set(["admin", "coordinator"]);

async function getUserForAccount(userId: string, accountId: string) {
  return prisma.user.findFirst({
    where: { id: userId, accountId },
    include: { _count: { select: { advisors: true } } },
  });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.role || !MUTATE_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Solo administradores o coordinadores" }, { status: 403 });
  }

  const { id } = await context.params;
  const user = await getUserForAccount(id, session.user.accountId);
  if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true, user: serializeUser(user) });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.role || !MUTATE_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Solo administradores o coordinadores" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await getUserForAccount(id, session.user.accountId);
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseUserPatchBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const d = parsed.data;
  const data: {
    email?: string;
    name?: string | null;
    role?: string;
    status?: string;
    password?: string;
  } = {};

  if (d.email !== undefined) data.email = d.email as string;
  if (d.name !== undefined) data.name = d.name as string | null;
  if (d.role !== undefined) data.role = d.role as string;
  if (d.status !== undefined) data.status = d.status as string;
  if (d.password !== undefined && d.password !== null) {
    data.password = await bcrypt.hash(d.password as string, 10);
  }

  try {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data,
      include: { _count: { select: { advisors: true } } },
    });

    try {
      await recordAuditEvent({
        accountId: session.user.accountId,
        entityType: "user",
        entityId: updated.id,
        action: "user_updated",
        actorType: "user",
        actorId: session.user.id,
        metadata: { fields: Object.keys(d) },
      });
    } catch (e) {
      console.error("[audit] user_updated", e);
    }

    return NextResponse.json({ ok: true, user: serializeUser(updated) });
  } catch (e) {
    const msg = String((e as Error)?.message ?? "");
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.role || !MUTATE_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Solo administradores o coordinadores" }, { status: 403 });
  }

  const { id } = await context.params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propio usuario" }, { status: 400 });
  }

  const existing = await getUserForAccount(id, session.user.accountId);
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.user.delete({ where: { id: existing.id } });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "user",
      entityId: id,
      action: "user_deleted",
      actorType: "user",
      actorId: session.user.id,
      metadata: { email: existing.email },
    });
  } catch (e) {
    console.error("[audit] user_deleted", e);
  }

  return NextResponse.json({ ok: true });
}
