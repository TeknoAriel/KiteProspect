/**
 * Pesos de dimensiones para matching (F2-E2). Solo admin. Persistido en Account.config.matchingWeights.
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import {
  extractMatchingWeightsFromAccountConfig,
  mergeMatchingWeightsIntoAccountConfig,
  type MatchingDimensionWeights,
} from "@/domains/auth-tenancy/account-matching-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isWeightsBody(o: unknown): o is { matchingWeights: MatchingDimensionWeights } {
  if (o === null || typeof o !== "object" || Array.isArray(o)) return false;
  const w = (o as { matchingWeights?: unknown }).matchingWeights;
  if (w === null || typeof w !== "object" || Array.isArray(w)) return false;
  const r = w as Record<string, unknown>;
  const keys = ["intent", "type", "zone", "price", "bedrooms"] as const;
  return keys.every((k) => typeof r[k] === "number" && Number.isFinite(r[k] as number));
}

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
    select: { config: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const matchingWeights = extractMatchingWeightsFromAccountConfig(account.config);
  return NextResponse.json({ ok: true, matchingWeights });
}

export async function PATCH(request: NextRequest) {
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
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!isWeightsBody(body)) {
    return NextResponse.json(
      { error: "matchingWeights inválido (intent, type, zone, price, bedrooms numéricos)." },
      { status: 400 },
    );
  }

  const account = await prisma.account.findFirst({
    where: { id: session.user.accountId },
    select: { id: true, config: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
  }

  const nextConfig = mergeMatchingWeightsIntoAccountConfig(account.config, {
    matchingWeights: body.matchingWeights,
  });

  const updated = await prisma.account.update({
    where: { id: account.id },
    data: { config: nextConfig },
    select: { config: true },
  });

  const matchingWeights = extractMatchingWeightsFromAccountConfig(updated.config);

  try {
    await recordAuditEvent({
      accountId: session.user.accountId,
      entityType: "account",
      entityId: account.id,
      action: "account_matching_weights_updated",
      actorType: "user",
      actorId: session.user.id,
      metadata: { matchingWeights },
    });
  } catch (e) {
    console.error("[audit] account_matching_weights_updated", e);
  }

  return NextResponse.json({ ok: true, matchingWeights });
}
