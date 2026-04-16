import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";

/** GET — últimos sync runs desde API KiteProp. */
export async function GET(request: NextRequest) {
  const denied = requireInternalOpsAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const accountId = searchParams.get("accountId")?.trim();

  const rows = await prisma.kitepropLeadSyncRun.findMany({
    where: accountId ? { accountId } : undefined,
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ items: rows });
}
