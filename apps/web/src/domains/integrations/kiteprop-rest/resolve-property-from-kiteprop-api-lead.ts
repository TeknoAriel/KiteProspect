import { prisma } from "@kite-prospect/db";

export type ResolvePropertyResult = {
  propertyId: string | null;
  externalPropertyRef: Record<string, unknown> | null;
};

/**
 * Resuelve Property local por externalId + source (p. ej. kiteprop feed).
 * Si no hay match, devuelve referencia externa para reconciliación posterior.
 */
export async function resolvePropertyFromKitepropApiLead(input: {
  accountId: string;
  propertyExternalId?: string;
  propertyExternalSource?: string;
}): Promise<ResolvePropertyResult> {
  const extId = input.propertyExternalId?.trim();
  if (!extId) {
    return { propertyId: null, externalPropertyRef: null };
  }

  const source = (input.propertyExternalSource?.trim() || "kiteprop").toLowerCase();

  const row = await prisma.property.findFirst({
    where: {
      accountId: input.accountId,
      externalId: extId,
      OR: [{ externalSource: source }, { externalSource: "kiteprop" }],
    },
    select: { id: true },
  });

  if (row) {
    return {
      propertyId: row.id,
      externalPropertyRef: { externalId: extId, externalSource: source, resolved: true },
    };
  }

  return {
    propertyId: null,
    externalPropertyRef: {
      externalId: extId,
      externalSource: source,
      resolved: false,
    },
  };
}
