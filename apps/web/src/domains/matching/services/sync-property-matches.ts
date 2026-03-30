/**
 * Persiste PropertyMatch para un contacto según inventario `available` y perfil actual.
 */
import { prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
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
  const contact = await prisma.contact.findFirst({
    where: { id: contactId, accountId },
    include: {
      searchProfiles: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!contact) {
    return { ok: false, error: "Contacto no encontrado." };
  }

  const profile = contact.searchProfiles[0];
  if (!profile) {
    return {
      ok: false,
      error: "No hay perfil de búsqueda. Completá el perfil del contacto antes de calcular matches.",
    };
  }

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

  const candidates: { propertyId: string; score: number; reason: string }[] = [];

  for (const p of properties) {
    const { score, reason } = scorePropertyAgainstProfile(profileInput, p);
    if (score >= MIN_PROPERTY_MATCH_SCORE) {
      candidates.push({ propertyId: p.id, score, reason });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.propertyMatch.findMany({
      where: { contactId },
      select: { id: true, propertyId: true },
    });
    const existingByPropertyId = new Map(existing.map((m) => [m.propertyId, m.id]));
    const candidatePropertyIds = new Set(candidates.map((c) => c.propertyId));

    const toDeleteIds = existing
      .filter((m) => !candidatePropertyIds.has(m.propertyId))
      .map((m) => m.id);
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
        preservedHistory: true,
        rulesVersion: "v0",
      },
    });
  } catch (e) {
    console.error("[audit] property_matches_synced failed", e);
  }

  return { ok: true, matchedCount: candidates.length };
}
