/**
 * Filtro opcional por sucursal en reportes operativos (F3-E4+ / L19).
 */
import type { Session } from "next-auth";
import { prisma } from "@kite-prospect/db";

export function parseOperationalReportBranchIdParam(
  raw: string | string[] | undefined,
): string | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

export async function resolveOperationalBranchFilter(
  accountId: string,
  branchIdParam: string | undefined,
  session?: Session | null,
): Promise<{
  branchId: string | undefined;
  branchFilter: { id: string; name: string; slug: string } | null;
}> {
  if (session?.user?.role === "advisor" && session.user.advisorBranchId) {
    const ab = session.user.advisorBranchId;
    if (branchIdParam && branchIdParam !== ab) {
      return { branchId: undefined, branchFilter: null };
    }
  }
  if (!branchIdParam) {
    return { branchId: undefined, branchFilter: null };
  }
  const b = await prisma.branch.findFirst({
    where: { id: branchIdParam, accountId, status: "active" },
    select: { id: true, name: true, slug: true },
  });
  if (!b) {
    return { branchId: undefined, branchFilter: null };
  }
  return { branchId: b.id, branchFilter: b };
}

/** Query string para `/dashboard/reportes` (días + sucursal opcional). */
export function buildReportesDashboardUrl(opts: { days: number; branchId?: string | null }): string {
  const p = new URLSearchParams();
  p.set("days", String(opts.days));
  if (opts.branchId) p.set("branchId", opts.branchId);
  return `/dashboard/reportes?${p.toString()}`;
}

/** Query string para export CSV (mismos parámetros que el dashboard). */
export function buildOperationalReportsExportUrl(opts: { days: number; branchId?: string | null }): string {
  const p = new URLSearchParams();
  p.set("days", String(opts.days));
  if (opts.branchId) p.set("branchId", opts.branchId);
  return `/api/exports/operational-reports?${p.toString()}`;
}
