import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";

/** GET — bandeja de borradores / revisión. */
export async function GET(request: NextRequest) {
  const denied = requireInternalOpsAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") ?? "40", 10) || 40));
  const accountId = searchParams.get("accountId")?.trim();
  const status = searchParams.get("status")?.trim();

  const rows = await prisma.leadReplyDraftReview.findMany({
    where: {
      ...(accountId ? { accountId } : {}),
      ...(status ? { reviewStatus: status } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      lead: {
        select: {
          id: true,
          status: true,
          source: true,
        },
      },
      property: {
        select: { id: true, title: true, externalId: true },
      },
    },
  });

  const withScores = await Promise.all(
    rows.map(async (r) => {
      const sc = await prisma.leadScore.findFirst({
        where: { leadId: r.leadId },
        orderBy: { createdAt: "desc" },
        select: { totalScore: true },
      });
      return { ...r, scoreTotal: sc?.totalScore ?? null };
    }),
  );

  return NextResponse.json({ items: withScores });
}
