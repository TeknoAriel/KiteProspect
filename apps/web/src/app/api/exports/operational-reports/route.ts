import { buildOperationalReportsCsv } from "@/domains/analytics/operational-reports-csv";
import { getOperationalReportsForAccount } from "@/domains/analytics/get-operational-reports";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Descarga CSV de reportes operativos del tenant (misma ventana que /dashboard/reportes).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const data = await getOperationalReportsForAccount(session.user.accountId);
  const body = buildOperationalReportsCsv(data);
  const filename = `reportes-operativos-${data.periodDays}d.csv`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
