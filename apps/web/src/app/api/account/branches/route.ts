/**
 * Sucursales por tenant (F3-E4 / L15). Solo admin.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { slugifyBranchName } from "@/domains/auth-tenancy/branch-slug";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function ensureUniqueSlug(accountId: string, base: string): Promise<string> {
  let candidate = base;
  let n = 2;
  while (
    await prisma.branch.findFirst({
      where: { accountId, slug: candidate },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "1";

  const rows = await prisma.branch.findMany({
    where: {
      accountId: session.user.accountId,
      ...(includeArchived ? {} : { status: "active" }),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { contacts: true } },
    },
  });

  return NextResponse.json({ ok: true, branches: rows });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.accountId || !session.user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const name = typeof o.name === "string" ? o.name.trim() : "";
  if (!name || name.length > 200) {
    return NextResponse.json({ error: "name requerido (máx. 200 caracteres)" }, { status: 400 });
  }

  const slugFromClient =
    typeof o.slug === "string" && o.slug.trim() ? slugifyBranchName(o.slug) : slugifyBranchName(name);
  const slug = await ensureUniqueSlug(session.user.accountId, slugFromClient);

  const row = await prisma.branch.create({
    data: {
      accountId: session.user.accountId,
      name,
      slug,
      status: "active",
    },
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "branch",
      entityId: row.id,
      action: "branch_created",
      actorType: "user",
      actorId: session.user.id,
      metadata: { name: row.name, slug: row.slug },
    });
  } catch (e) {
    console.error("[audit] branch_created", e);
  }

  return NextResponse.json({
    ok: true,
    branch: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
    },
  });
}
