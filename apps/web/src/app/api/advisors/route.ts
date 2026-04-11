/**
 * Listado y alta de Advisor (F1-E3). Solo admin o coordinador.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { serializeAdvisor } from "@/domains/advisors/advisor-serialization";
import { assertBranchBelongsToAccount } from "@/domains/advisors/assert-advisor-branch";
import { parseAdvisorCreateBody } from "@/domains/advisors/validate-advisor-payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MUTATE_ROLES = new Set(["admin", "coordinator"]);

async function assertUserAvailableForAdvisor(
  accountId: string,
  userId: string,
  excludeAdvisorId?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await prisma.user.findFirst({
    where: { id: userId, accountId },
  });
  if (!user) {
    return { ok: false, error: "Usuario no encontrado en esta cuenta" };
  }

  const taken = await prisma.advisor.findFirst({
    where: {
      accountId,
      userId,
      ...(excludeAdvisorId ? { NOT: { id: excludeAdvisorId } } : {}),
    },
  });
  if (taken) {
    return { ok: false, error: "Ese usuario ya está vinculado a otro asesor" };
  }
  return { ok: true };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.role || !MUTATE_ROLES.has(session.user.role)) {
    return NextResponse.json({ error: "Solo administradores o coordinadores" }, { status: 403 });
  }

  const rows = await prisma.advisor.findMany({
    where: { accountId: session.user.accountId },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      user: { select: { email: true, name: true } },
      branch: { select: { id: true, name: true, slug: true } },
      _count: { select: { assignments: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    advisors: rows.map(serializeAdvisor),
  });
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

  const parsed = parseAdvisorCreateBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const d = parsed.data;
  const userId = d.userId as string | null | undefined;

  if (userId) {
    const check = await assertUserAvailableForAdvisor(session.user.accountId, userId);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 409 });
  }

  if (d.branchId !== undefined && d.branchId !== null) {
    const br = await assertBranchBelongsToAccount(session.user.accountId, d.branchId as string);
    if (!br.ok) return NextResponse.json({ error: br.error }, { status: 400 });
  }

  const created = await prisma.advisor.create({
    data: {
      accountId: session.user.accountId,
      name: d.name as string,
      email: d.email as string | null | undefined,
      phone: d.phone as string | null | undefined,
      status: d.status as string,
      userId: userId ?? null,
      ...(d.branchId !== undefined && { branchId: d.branchId as string | null }),
    },
    include: {
      user: { select: { email: true, name: true } },
      branch: { select: { id: true, name: true, slug: true } },
      _count: { select: { assignments: true } },
    },
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "advisor",
      entityId: created.id,
      action: "advisor_created",
      actorType: "user",
      actorId: session.user.id,
      metadata: { name: created.name, userId: created.userId },
    });
  } catch (e) {
    console.error("[audit] advisor_created", e);
  }

  return NextResponse.json({ ok: true, advisor: serializeAdvisor(created) }, { status: 201 });
}
