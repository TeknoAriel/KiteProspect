import bcrypt from "bcryptjs";
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { serializeUser } from "@/domains/users/user-serialization";
import { parseUserCreateBody } from "@/domains/users/validate-user-payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MUTATE_ROLES = new Set(["admin", "coordinator"]);

export async function GET() {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.role || !MUTATE_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Solo administradores o coordinadores" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { accountId: session.user.accountId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { advisors: true } } },
    take: 200,
  });
  return NextResponse.json({ ok: true, users: users.map(serializeUser) });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.role || !MUTATE_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Solo administradores o coordinadores" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseUserCreateBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const d = parsed.data;
  const hashedPassword = await bcrypt.hash(d.password as string, 10);

  try {
    const created = await prisma.user.create({
      data: {
        accountId: session.user.accountId,
        email: d.email as string,
        password: hashedPassword,
        name: d.name as string | null,
        role: d.role as string,
        status: d.status as string,
      },
      include: { _count: { select: { advisors: true } } },
    });

    try {
      await recordAuditEvent({
        accountId: session.user.accountId,
        entityType: "user",
        entityId: created.id,
        action: "user_created",
        actorType: "user",
        actorId: session.user.id,
        metadata: { role: created.role, status: created.status },
      });
    } catch (e) {
      console.error("[audit] user_created", e);
    }

    return NextResponse.json({ ok: true, user: serializeUser(created) }, { status: 201 });
  } catch (e) {
    const msg = String((e as Error)?.message ?? "");
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
    }
    throw e;
  }
}
