/**
 * Persiste PropertyMatch para un contacto según inventario `available` y perfil actual.
 */
import { prisma } from "@kite-prospect/db";
import { extractMatchingWeightsFromAccountConfig } from "@/domains/auth-tenancy/account-matching-config";
import { selectPreferredSearchProfile } from "@/domains/crm-leads/search-profile-preference";
import { recordAuditEvent } from "@/lib/audit";
import { logStructured } from "@/lib/structured-log";
import { parseExcludedPropertyIdsFromProfileExtra } from "./search-profile-matching-extras";
import { scorePropertyAgainstProfile } from "./score-property-match";

/** Por debajo de este umbral no guardamos fila (evita ruido en UI). */
export const MIN_PROPERTY_MATCH_SCORE = 30;

export type SyncPropertyMatchesResult =
  | { ok: true; matchedCount: number }
  | { ok: false; error: string };

export async function syncPropertyMatchesForContact(
  contactId: string,
  accountId: string,
  actorUserId: string | null,
): Promise<SyncPropertyMatchesResult> {
  const [contact, accountRow] = await Promise.all([
    prisma.contact.findFirst({
      where: { id: contactId, accountId },
      include: {
        searchProfiles: {
          orderBy: { updatedAt: "desc" },
        },
      },
    }),
    prisma.account.findFirst({
      where: { id: accountId },
      select: { config: true },
    }),
  ]);

  if (!contact) {
    return { ok: false, error: "Contacto no encontrado." };
  }

  const profile = selectPreferredSearchProfile(contact.searchProfiles);
  if (!profile) {
    return {
      ok: false,
      error: "No hay perfil de búsqueda. Completá el perfil del contacto antes de calcular matches.",
    };
  }

  const weights = extractMatchingWeightsFromAccountConfig(accountRow?.config);
  const excludedIds = parseExcludedPropertyIdsFromProfileExtra(profile.extra);

  const properties = await prisma.property.findMany({
    where: { accountId, status: "available" },
    select: {
      id: true,
      type: true,
      intent: true,
      zone: true,
      price: true,
      bedrooms: true,
      status: true,
    },
  });

  const profileInput = {
    intent: profile.intent,
    propertyType: profile.propertyType,
    zone: profile.zone,
    minPrice: profile.minPrice,
    maxPrice: profile.maxPrice,
    bedrooms: profile.bedrooms,
  };

  const existingBefore = await prisma.propertyMatch.findMany({
    where: { contactId },
    select: { id: true, propertyId: true, feedback: true },
  });
  const notInterestedIds = new Set(
    existingBefore.filter((m) => m.feedback === "not_interested").map((m) => m.propertyId),
  );

  const candidates: { propertyId: string; score: number; reason: string }[] = [];

  for (const p of properties) {
    if (excludedIds.has(p.id) || notInterestedIds.has(p.id)) continue;
    const { score, reason } = scorePropertyAgainstProfile(profileInput, p, { weights });
    if (score >= MIN_PROPERTY_MATCH_SCORE) {
      candidates.push({ propertyId: p.id, score, reason });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const existing = existingBefore;
  const existingByPropertyId = new Map(existing.map((m) => [m.propertyId, m.id]));

  const candidatePropertyIds = new Set(candidates.map((c) => c.propertyId));
  const toDeleteIds = existing
    .filter((m) => !candidatePropertyIds.has(m.propertyId))
    .filter((m) => m.feedback !== "not_interested")
    .map((m) => m.id);

  await prisma.$transaction(async (tx) => {
    if (toDeleteIds.length > 0) {
      await tx.propertyMatch.deleteMany({
        where: {
          id: { in: toDeleteIds },
        },
      });
    }

    for (const c of candidates) {
      const existingId = existingByPropertyId.get(c.propertyId);
      if (existingId) {
        await tx.propertyMatch.update({
          where: { id: existingId },
          data: {
            score: c.score,
            reason: c.reason,
          },
        });
        continue;
      }

      await tx.propertyMatch.create({
        data: {
          contactId,
          propertyId: c.propertyId,
          score: c.score,
          reason: c.reason,
        },
      });
    }
  });

  logStructured("property_matches_synced", {
    accountId,
    contactId,
    inventoryCount: properties.length,
    matchedCount: candidates.length,
    removedCount: toDeleteIds.length,
    rulesVersion: "v1",
    excludedCount: excludedIds.size,
    notInterestedPreserved: notInterestedIds.size,
  });

  try {
    await recordAuditEvent({
      accountId,
      entityType: "contact",
      entityId: contactId,
      action: "property_matches_synced",
      actorType: "user",
      actorId: actorUserId ?? undefined,
      metadata: {
        matchedCount: candidates.length,
        inventoryCount: properties.length,
        removedCount: toDeleteIds.length,
        preservedHistory: true,
        rulesVersion: "v1",
      },
    });
  } catch (e) {
    console.error("[audit] property_matches_synced failed", e);
  }

  return { ok: true, matchedCount: candidates.length };
}
