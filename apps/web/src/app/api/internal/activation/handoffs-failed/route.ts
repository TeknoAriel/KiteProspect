import { NextRequest, NextResponse } from "next/server";
import { Prisma, prisma } from "@kite-prospect/db";
import { requireInternalOpsAuth } from "@/lib/internal-api-auth";

/**
 * GET — leads `qualified` con al menos un intento HTTP sin ACK (`ok: false`) y sin ningún intento con ACK.
 * Útil para colas operativas (5xx, red) o 422 hasta corrección de datos.
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

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      accountId: string;
      contactId: string;
      status: string;
      updatedAt: Date;
    }>
  >(
    accountId
      ? Prisma.sql`
    SELECT l.id, l."accountId", l."contactId", l.status, l."updatedAt"
    FROM "Lead" l
    WHERE l.status = 'qualified'
    AND l."accountId" = ${accountId}
    AND EXISTS (
      SELECT 1 FROM "HandoffOutboundAttempt" h
      WHERE h."leadId" = l.id AND h.ok = false
    )
    AND NOT EXISTS (
      SELECT 1 FROM "HandoffOutboundAttempt" h2
      WHERE h2."leadId" = l.id AND h2.ok = true
    )
    ORDER BY l."updatedAt" DESC
    LIMIT ${limit}
  `
      : Prisma.sql`
    SELECT l.id, l."accountId", l."contactId", l.status, l."updatedAt"
    FROM "Lead" l
    WHERE l.status = 'qualified'
    AND EXISTS (
      SELECT 1 FROM "HandoffOutboundAttempt" h
      WHERE h."leadId" = l.id AND h.ok = false
    )
    AND NOT EXISTS (
      SELECT 1 FROM "HandoffOutboundAttempt" h2
      WHERE h2."leadId" = l.id AND h2.ok = true
    )
    ORDER BY l."updatedAt" DESC
    LIMIT ${limit}
  `,
  );

  return NextResponse.json({ items: rows });
}
