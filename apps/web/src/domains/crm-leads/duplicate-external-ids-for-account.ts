import { prisma } from "@kite-prospect/db";

export type DuplicateExternalIdRow = {
  externalId: string;
  count: number;
};

/**
 * Grupos donde el mismo `externalId` aparece más de una vez en la cuenta (no debería ocurrir con índice único L27).
 */
export async function findDuplicateExternalIdsForAccount(
  accountId: string,
): Promise<DuplicateExternalIdRow[]> {
  const rows = await prisma.$queryRaw<Array<{ externalId: string; count: bigint }>>`
    SELECT "externalId", COUNT(*)::bigint AS count
    FROM "Contact"
    WHERE "accountId" = ${accountId}
      AND "externalId" IS NOT NULL
    GROUP BY "externalId"
    HAVING COUNT(*) > 1
    ORDER BY "externalId" ASC
  `;
  return rows.map((r) => ({
    externalId: r.externalId,
    count: Number(r.count),
  }));
}
