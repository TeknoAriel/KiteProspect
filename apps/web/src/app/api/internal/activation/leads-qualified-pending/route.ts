import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";

/**
 * GET — leads en `qualified` aún no `handed_off` (pendientes de ACK KiteProp o sin intento).
 */
export async function GET(request: NextRequest) {
  const denied = requireInternalOpsAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    200,
    Math.max(1, Number.parseInt(searchParams.get("limit") ?? "50", 10) || 50),
  );
  const accountId = searchParams.get("accountId")?.trim();

  const rows = await prisma.lead.findMany({
    where: {
      status: "qualified",
      ...(accountId ? { accountId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      accountId: true,
      contactId: true,
      status: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ items: rows });
}
