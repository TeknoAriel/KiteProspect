/**
 * Listado y alta de Property (F1-E4). Lectura: cualquier rol del tenant;
 * alta: admin o coordinador.
 */
import { prisma } from "@kite-prospect/db";
import type { Prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { serializeProperty } from "@/domains/properties/property-serialization";
import { parsePropertyCreateBody } from "@/domains/properties/validate-property-payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MUTATE_ROLES = new Set(["admin", "coordinator"]);

export async function GET() {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rows = await prisma.property.findMany({
    where: { accountId: session.user.accountId },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    ok: true,
    properties: rows.map(serializeProperty),
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

  const parsed = parsePropertyCreateBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const d = parsed.data;
  const data: Prisma.PropertyCreateInput = {
    account: { connect: { id: session.user.accountId } },
    title: d.title as string,
    description: d.description as string | null | undefined,
    type: d.type as string,
    intent: d.intent as string,
    zone: d.zone as string | null | undefined,
    address: d.address as string | null | undefined,
    price: d.price as string,
    status: (d.status as string) ?? "available",
  };

  if (d.bedrooms !== undefined) data.bedrooms = d.bedrooms as number | null;
  if (d.bathrooms !== undefined) data.bathrooms = d.bathrooms as number | null;
  if (d.area !== undefined) {
    data.area =
      d.area === null ? null : (typeof d.area === "string" ? d.area : String(d.area));
  }
  if (d.metadata !== undefined) {
    data.metadata = (d.metadata === null ? null : d.metadata) as Prisma.InputJsonValue;
  }

  const created = await prisma.property.create({ data });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "property",
      entityId: created.id,
      action: "property_created",
      actorType: "user",
      actorId: session.user.id,
      metadata: { title: created.title, status: created.status },
    });
  } catch (e) {
    console.error("[audit] property_created", e);
  }

  return NextResponse.json({ ok: true, property: serializeProperty(created) }, { status: 201 });
}
