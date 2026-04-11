/**
 * Diagnóstico CRM externo (F3-E1+): duplicados de `externalId` en el tenant.
 * Solo admin. No expone emails ni nombres; solo IDs externos duplicados y conteos.
 */
import { prisma } from "@kite-prospect/db";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findDuplicateExternalIdsForAccount } from "@/domains/crm-leads/duplicate-external-ids-for-account";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const accountId = session.user.accountId;

  const [withExternal, duplicateGroups] = await Promise.all([
    prisma.contact.count({
      where: { accountId, externalId: { not: null } },
    }),
    findDuplicateExternalIdsForAccount(accountId),
  ]);

  return NextResponse.json({
    ok: true,
    accountId,
    contactsWithExternalId: withExternal,
    duplicateExternalIdGroups: duplicateGroups,
    hasDuplicates: duplicateGroups.length > 0,
  });
}
