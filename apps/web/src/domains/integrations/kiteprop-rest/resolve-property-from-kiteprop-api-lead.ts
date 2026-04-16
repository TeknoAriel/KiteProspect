import { prisma } from "@kite-prospect/db";

export type ResolvePropertyResult = {
  propertyId: string | null;
  externalPropertyRef: Record<string, unknown> | null;
};

function normalizedIdCandidates(raw: string): string[] {
  const base = raw.trim();
  if (!base) return [];
  const set = new Set<string>([base]);
  const digits = base.replace(/\D+/g, "");
  if (digits.length >= 4) set.add(digits);
  return Array.from(set);
}

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
  const candidates = normalizedIdCandidates(extId);

  const rowExact = await prisma.property.findFirst({
    where: {
      accountId: input.accountId,
      externalId: { in: candidates },
      OR: [{ externalSource: source }, { externalSource: "kiteprop" }],
    },
    select: { id: true },
  });

  if (rowExact) {
    return {
      propertyId: rowExact.id,
      externalPropertyRef: {
        externalId: extId,
        externalSource: source,
        resolved: true,
        matchedBy: "externalId",
      },
    };
  }

  const rowByReference = await prisma.property.findFirst({
    where: {
      accountId: input.accountId,
      OR: candidates.flatMap((id) => [
        {
          metadata: {
            path: ["kiteprop", "claveReferencia"],
            equals: id,
          },
        },
        {
          metadata: {
            path: ["kiteprop", "publicUrl"],
            string_contains: id,
          },
        },
      ]),
    },
    select: { id: true },
  });

  if (rowByReference) {
    return {
      propertyId: rowByReference.id,
      externalPropertyRef: {
        externalId: extId,
        externalSource: source,
        resolved: true,
        matchedBy: "metadataReference",
      },
    };
  }

  return {
    propertyId: null,
    externalPropertyRef: {
      externalId: extId,
      externalSource: source,
      resolved: false,
      normalizedCandidatesTried: candidates,
    },
  };
}
