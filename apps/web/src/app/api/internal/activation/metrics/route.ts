import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";

/**
 * GET — agregados simples por cuenta (24h): qualify, handoff, intentos HTTP por resultado.
 */
export async function GET(request: NextRequest) {
  const denied = requireInternalOpsAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const hours = Math.min(
    168,
    Math.max(1, Number.parseInt(searchParams.get("hours") ?? "24", 10) || 24),
  );
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const accountId = searchParams.get("accountId")?.trim();

  const [qualifyCount, handoffAudit, handoffAttempts, channelStates] =
    await Promise.all([
      prisma.auditEvent.count({
        where: {
          createdAt: { gte: since },
          action: { in: ["lead_qualified", "lead_qualified_manual"] },
          ...(accountId ? { accountId } : {}),
        },
      }),
      prisma.auditEvent.count({
        where: {
          createdAt: { gte: since },
          action: "lead_handed_off",
          ...(accountId ? { accountId } : {}),
        },
      }),
      prisma.handoffOutboundAttempt.groupBy({
        by: ["accountId", "ok"],
        where: {
          createdAt: { gte: since },
          ...(accountId ? { accountId } : {}),
        },
        _count: { _all: true },
      }),
      prisma.channelState.findMany({
        where: {
          updatedAt: { gte: since },
          ...(accountId ? { accountId } : {}),
        },
        select: { accountId: true, channel: true, lastInboundAt: true },
        take: 500,
      }),
    ]);

  const byAccountChannel: Record<string, Record<string, number>> = {};
  for (const row of channelStates) {
    const a = row.accountId;
    const ch = row.channel;
    if (!byAccountChannel[a]) byAccountChannel[a] = {};
    byAccountChannel[a][ch] = (byAccountChannel[a][ch] ?? 0) + 1;
  }

  return NextResponse.json({
    windowHours: hours,
    qualifyEvents: qualifyCount,
    handoffAuditEvents: handoffAudit,
    handoffAttemptsByOk: handoffAttempts,
    channelActivitySample: byAccountChannel,
  });
}
