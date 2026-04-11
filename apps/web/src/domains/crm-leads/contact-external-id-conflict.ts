import { prisma } from "@kite-prospect/db";

/**
 * Si `nextExternalId` no es null, devuelve otro contacto del mismo tenant que ya usa ese ID (excluye `contactId`).
 */
export async function findContactExternalIdConflict(params: {
  accountId: string;
  contactId: string;
  nextExternalId: string | null;
}): Promise<{ id: string } | null> {
  const { accountId, contactId, nextExternalId } = params;
  if (nextExternalId === null) {
    return null;
  }
  return prisma.contact.findFirst({
    where: {
      accountId,
      externalId: nextExternalId,
      NOT: { id: contactId },
    },
    select: { id: true },
  });
}
