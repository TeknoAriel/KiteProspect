/**
 * API keys por tenant para captura (F3-E2). Solo admin.
 */
import bcrypt from "bcryptjs";
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { generateCaptureApiKeyMaterial } from "@/domains/capture/services/capture-api-key-format";

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

  const keys = await prisma.captureApiKey.findMany({
    where: { accountId: session.user.accountId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
      revokedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    keys: keys.map((k) => ({
      ...k,
      keyHint: `kp_${k.keyPrefix}_…`,
    })),
  });
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
  const label = typeof o.name === "string" ? o.name.trim() : "";

  const { keyPrefix, raw } = generateCaptureApiKeyMaterial();
  const keyHash = await bcrypt.hash(raw, 10);

  const row = await prisma.captureApiKey.create({
    data: {
      accountId: session.user.accountId,
      name: label || null,
      keyPrefix,
      keyHash,
    },
  });

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "capture_api_key",
      entityId: row.id,
      action: "capture_api_key_created",
      actorType: "user",
      actorId: session.user.id,
      metadata: { name: label || null },
    });
  } catch (e) {
    console.error("[audit] capture_api_key_created", e);
  }

  return NextResponse.json({
    ok: true,
    id: row.id,
    key: raw,
    message: "Guardá la clave ahora; no se volverá a mostrar.",
  });
}
