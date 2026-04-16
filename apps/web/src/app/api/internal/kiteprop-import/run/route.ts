import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";
import { runKitepropLeadSync } from "@/domains/integrations/kiteprop-rest/run-kiteprop-lead-sync";

/**
 * POST — ejecuta sync desde KiteProp REST API (últimos N días según env).
 * Body opcional: `{ "accountSlug": "demo" }` o `{ "accountId": "..." }`
 */
export async function POST(request: NextRequest) {
  const denied = requireInternalOpsAuth(request);
  if (denied) return denied;

  let body: { accountSlug?: string; accountId?: string; lookbackDays?: number };
  try {
    body = (await request.json()) as {
      accountSlug?: string;
      accountId?: string;
      lookbackDays?: number;
    };
  } catch {
    body = {};
  }

  let accountId = typeof body.accountId === "string" ? body.accountId.trim() : "";
  if (!accountId && typeof body.accountSlug === "string" && body.accountSlug.trim()) {
    const acc = await prisma.account.findUnique({
      where: { slug: body.accountSlug.trim() },
      select: { id: true },
    });
    if (!acc) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }
    accountId = acc.id;
  }
  if (!accountId) {
    const first = await prisma.account.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } });
    if (!first) {
      return NextResponse.json({ error: "Sin cuentas en BD" }, { status: 400 });
    }
    accountId = first.id;
  }

  const lookbackDays =
    typeof body.lookbackDays === "number" && Number.isFinite(body.lookbackDays)
      ? body.lookbackDays
      : undefined;

  try {
    const result = await runKitepropLeadSync(accountId, { lookbackDays });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
