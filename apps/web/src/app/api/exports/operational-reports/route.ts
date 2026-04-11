import { buildOperationalReportsCsv } from "@/domains/analytics/operational-reports-csv";
import {
  parseOperationalReportBranchIdParam,
  resolveOperationalBranchFilter,
} from "@/domains/analytics/operational-reports-branch";
import { parseOperationalReportPeriodDays } from "@/domains/analytics/operational-reports-period";
import { getOperationalReportsForAccount } from "@/domains/analytics/get-operational-reports";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Descarga CSV de reportes operativos del tenant (misma ventana que /dashboard/reportes).
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const days = parseOperationalReportPeriodDays(
    request.nextUrl.searchParams.get("days") ?? undefined,
  );
  const branchParam = parseOperationalReportBranchIdParam(
    request.nextUrl.searchParams.get("branchId") ?? undefined,
  );
  const { branchId, branchFilter } = await resolveOperationalBranchFilter(
    session.user.accountId,
    branchParam,
    session,
  );
  const data = await getOperationalReportsForAccount(session.user.accountId, {
    session,
    periodDays: days,
    branchId,
    branchFilter,
  });
  const body = buildOperationalReportsCsv(data);
  const slug = data.branchFilter?.slug?.replace(/[^\w.-]+/g, "_") ?? "todas";
  const filename = `reportes-operativos-${data.periodDays}d-${slug}.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
