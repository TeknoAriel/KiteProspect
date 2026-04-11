/**
 * Detalle, actualización y baja de Advisor (F1-E3).
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { serializeAdvisor } from "@/domains/advisors/advisor-serialization";
import { assertBranchBelongsToAccount } from "@/domains/advisors/assert-advisor-branch";
import { parseAdvisorPatchBody } from "@/domains/advisors/validate-advisor-payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MUTATE_ROLES = new Set(["admin", "coordinator"]);

async function getAdvisorForAccount(advisorId: string, accountId: string) {
  return prisma.advisor.findFirst({
    where: { id: advisorId, accountId },
    include: {
      user: { select: { email: true, name: true } },
      _count: { select: { assignments: true } },
    },
  });
}

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
  const row = await getAdvisorForAccount(id, session.user.accountId);
  if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true, advisor: serializeAdvisor(row) });
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
  const existing = await getAdvisorForAccount(id, session.user.accountId);
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseAdvisorPatchBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const d = parsed.data;
  if (d.userId !== undefined && d.userId !== null) {
    const check = await assertUserAvailableForAdvisor(
      session.user.accountId,
      d.userId as string,
      existing.id,
    );
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 409 });
  }

  if (d.branchId !== undefined) {
    const br = await assertBranchBelongsToAccount(session.user.accountId, d.branchId as string | null);
    if (!br.ok) return NextResponse.json({ error: br.error }, { status: 400 });
  }

  const updated = await prisma.advisor.update({
    where: { id: existing.id },
    data: {
      ...(d.name !== undefined && { name: d.name as string }),
      ...(d.email !== undefined && { email: d.email as string | null }),
      ...(d.phone !== undefined && { phone: d.phone as string | null }),
      ...(d.status !== undefined && { status: d.status as string }),
      ...(d.userId !== undefined && { userId: d.userId as string | null }),
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
      entityId: updated.id,
      action: "advisor_updated",
      actorType: "user",
      actorId: session.user.id,
      metadata: { fields: Object.keys(d) },
    });
  } catch (e) {
    console.error("[audit] advisor_updated", e);
  }

  return NextResponse.json({ ok: true, advisor: serializeAdvisor(updated) });
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
  const existing = await getAdvisorForAccount(id, session.user.accountId);
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.advisor.delete({ where: { id: existing.id } });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "advisor",
      entityId: id,
      action: "advisor_deleted",
      actorType: "user",
      actorId: session.user.id,
      metadata: { name: existing.name },
    });
  } catch (e) {
    console.error("[audit] advisor_deleted", e);
  }

  return NextResponse.json({ ok: true });
}
