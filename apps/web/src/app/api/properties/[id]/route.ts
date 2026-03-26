/**
 * Detalle, actualización y baja de Property (F1-E4).
 * Lectura: cualquier rol del tenant; mutaciones: admin o coordinador.
 */
import { prisma } from "@kite-prospect/db";
import type { Prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { serializeProperty } from "@/domains/properties/property-serialization";
import { parsePropertyPatchBody } from "@/domains/properties/validate-property-payload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MUTATE_ROLES = new Set(["admin", "coordinator"]);

async function getPropertyForAccount(propertyId: string, accountId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, accountId },
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

  const { id } = await context.params;
  const row = await getPropertyForAccount(id, session.user.accountId);
  if (!row) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, property: serializeProperty(row) });
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
  const existing = await getPropertyForAccount(id, session.user.accountId);
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parsePropertyPatchBody(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const d = parsed.data;
  const data: Prisma.PropertyUpdateInput = {};

  if (d.title !== undefined) data.title = d.title as string;
  if (d.description !== undefined) data.description = d.description as string | null;
  if (d.type !== undefined) data.type = d.type as string;
  if (d.intent !== undefined) data.intent = d.intent as string;
  if (d.zone !== undefined) data.zone = d.zone as string | null;
  if (d.address !== undefined) data.address = d.address as string | null;
  if (d.price !== undefined) data.price = d.price as string;
  if (d.bedrooms !== undefined) data.bedrooms = d.bedrooms as number | null;
  if (d.bathrooms !== undefined) data.bathrooms = d.bathrooms as number | null;
  if (d.area !== undefined) {
    data.area =
      d.area === null ? null : (typeof d.area === "string" ? d.area : String(d.area));
  }
  if (d.status !== undefined) data.status = d.status as string;
  if (d.metadata !== undefined) {
    data.metadata = (d.metadata === null ? null : d.metadata) as Prisma.InputJsonValue;
  }

  const updated = await prisma.property.update({
    where: { id: existing.id },
    data,
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "property",
      entityId: updated.id,
      action: "property_updated",
      actorType: "user",
      actorId: session.user.id,
      metadata: { fields: Object.keys(d) },
    });
  } catch (e) {
    console.error("[audit] property_updated", e);
  }

  return NextResponse.json({ ok: true, property: serializeProperty(updated) });
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
  const existing = await getPropertyForAccount(id, session.user.accountId);
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  await prisma.property.delete({ where: { id: existing.id } });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "property",
      entityId: id,
      action: "property_deleted",
      actorType: "user",
      actorId: session.user.id,
      metadata: { title: existing.title },
    });
  } catch (e) {
    console.error("[audit] property_deleted", e);
  }

  return NextResponse.json({ ok: true });
}
