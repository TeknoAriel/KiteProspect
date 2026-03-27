/**
 * Lectura/actualización de configuración general de cuenta (solo admin).
 * MVP F1-E2: nombre visible + timezone en Account.config.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import {
  extractGeneralFromAccountConfig,
  mergeGeneralIntoAccountConfig,
} from "@/domains/auth-tenancy/account-general-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const account = await prisma.account.findFirst({
    where: { id: session.user.accountId },
    select: { id: true, name: true, config: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const general = extractGeneralFromAccountConfig(account.config);
  return NextResponse.json({ ok: true, name: account.name, ...general });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  let body: { name?: string | null; timezone?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const account = await prisma.account.findFirst({
    where: { id: session.user.accountId },
    select: { id: true, name: true, config: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  let namePatch: string | undefined;
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json({ error: "name inválido" }, { status: 400 });
    }
    namePatch = body.name.trim().slice(0, 120);
  }

  const nextConfig = mergeGeneralIntoAccountConfig(account.config, {
    timezone: body.timezone,
  });

  const updated = await prisma.account.update({
    where: { id: account.id },
    data: {
      ...(namePatch !== undefined && { name: namePatch }),
      config: nextConfig,
    },
    select: { id: true, name: true, config: true },
  });

  const general = extractGeneralFromAccountConfig(updated.config);

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "account",
      entityId: updated.id,
      action: "account_general_config_updated",
      actorType: "user",
      actorId: session.user.id,
      metadata: {
        changedName: namePatch !== undefined && namePatch !== account.name,
        timezone: general.timezone ?? null,
      },
    });
  } catch (e) {
    console.error("[audit] account_general_config_updated", e);
  }

  return NextResponse.json({
    ok: true,
    name: updated.name,
    ...general,
  });
}
