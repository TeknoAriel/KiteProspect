import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";

/**
 * GET — últimos intentos de handoff (KiteProp) con latencia y estado HTTP.
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

  const rows = await prisma.handoffOutboundAttempt.findMany({
    where: accountId ? { accountId } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      accountId: true,
      leadId: true,
      contactId: true,
      dedupeKey: true,
      eventId: true,
      attemptNumber: true,
      targetUrl: true,
      httpStatus: true,
      ok: true,
      latencyMs: true,
      errorMessage: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ items: rows });
}
