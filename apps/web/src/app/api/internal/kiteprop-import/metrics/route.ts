import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";

/** GET — agregados recientes import + drafts. */
export async function GET(request: NextRequest) {
  const denied = requireInternalOpsAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const hours = Math.min(168, Math.max(1, Number.parseInt(searchParams.get("hours") ?? "168", 10) || 168));
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const accountId = searchParams.get("accountId")?.trim();

  const whereAccount = accountId ? { accountId } : {};

  const [runs, draftStats, manualCount, recentSyncRuns, draftsPendingTotal] =
    await Promise.all([
      prisma.kitepropLeadSyncRun.aggregate({
        where: { startedAt: { gte: since }, ...whereAccount },
        _sum: {
          fetchedCount: true,
          importedCount: true,
          dedupedCount: true,
          skippedCount: true,
          errorCount: true,
        },
        _count: { _all: true },
      }),
      prisma.leadReplyDraftReview.groupBy({
        by: ["reviewStatus"],
        where: { createdAt: { gte: since }, ...whereAccount },
        _count: { _all: true },
      }),
      prisma.leadReplyDraftReview.count({
        where: {
          createdAt: { gte: since },
          manualReviewRequired: true,
          ...whereAccount,
        },
      }),
      prisma.kitepropLeadSyncRun.findMany({
        where: { startedAt: { gte: since }, ...whereAccount },
        orderBy: { startedAt: "desc" },
        take: 15,
      }),
      prisma.leadReplyDraftReview.count({
        where: {
          ...whereAccount,
          reviewStatus: {
            in: ["draft_pending_review", "manual_review_required"],
          },
        },
      }),
    ]);

  return NextResponse.json({
    windowHours: hours,
    syncRunsCount: runs._count._all,
    sums: runs._sum,
    draftsByStatus: draftStats,
    manualReviewRequiredCount: manualCount,
    draftsPendingTotal,
    recentSyncRuns,
  });
}
