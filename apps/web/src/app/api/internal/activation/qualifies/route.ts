import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";

/**
 * GET — últimos eventos de auditoría `lead_qualified` / manual.
 */
export async function GET(request: NextRequest) {
  const denied = requireInternalOpsAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("limit") ?? "30", 10) || 30),
  );
  const accountId = searchParams.get("accountId")?.trim();

  const rows = await prisma.auditEvent.findMany({
    where: {
      action: { in: ["lead_qualified", "lead_qualified_manual"] },
      ...(accountId ? { accountId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      accountId: true,
      entityId: true,
      action: true,
      metadata: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ items: rows });
}
