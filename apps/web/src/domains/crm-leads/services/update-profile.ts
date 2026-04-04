/**
 * Perfil de búsqueda declarado (SearchProfile source=declared) + espejo en Contact.declaredProfile
 * para IA (`plan-next-conversation-action`). F1-E10.
 */
import { Prisma, prisma } from "@kite-prospect/db";
import { selectPreferredSearchProfile } from "../search-profile-preference";

export interface DeclaredSearchProfileFields {
  intent: string | null;
  propertyType: string | null;
  zone: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  extra: Record<string, unknown> | null;
}

function toDecimal(n: number | null): Prisma.Decimal | null {
  if (n === null) return null;
  return new Prisma.Decimal(n);
}

async function syncContactDeclaredProfileJson(contactId: string) {
  const sp = await prisma.searchProfile.findFirst({
    where: { contactId, source: "declared" },
    orderBy: { updatedAt: "desc" },
  });
  if (!sp) return;

  const payload: Prisma.InputJsonValue = {
    intent: sp.intent,
    propertyType: sp.propertyType,
    zone: sp.zone,
    minPrice: sp.minPrice != null ? Number(sp.minPrice) : null,
    maxPrice: sp.maxPrice != null ? Number(sp.maxPrice) : null,
    bedrooms: sp.bedrooms,
    bathrooms: sp.bathrooms,
    extra: sp.extra === null ? null : sp.extra,
    source: "declared",
    updatedAt: sp.updatedAt.toISOString(),
  };

  await prisma.contact.update({
    where: { id: contactId },
    data: { declaredProfile: payload },
  });
}

/** Recalcula etapa conversacional según el perfil preferido (declarado > inferido). */
export async function refreshConversationalStageForContact(contactId: string) {
  const profiles = await prisma.searchProfile.findMany({
    where: { contactId },
  });

  const profile = selectPreferredSearchProfile(profiles);

  if (!profile) return;

  const hasUsefulData =
    profile.intent ||
    profile.propertyType ||
    profile.zone ||
    profile.maxPrice ||
    profile.bedrooms;

  if (hasUsefulData) {
    await prisma.contact.update({
      where: { id: contactId },
      data: { conversationalStage: "profiled_useful" },
    });
  } else {
    await prisma.contact.update({
      where: { id: contactId },
      data: { conversationalStage: "profiled_partial" },
    });
  }
}

/**
 * Crea o actualiza el SearchProfile `declared` del contacto y sincroniza `Contact.declaredProfile`.
 */
export async function upsertDeclaredSearchProfile(
  contactId: string,
  fields: DeclaredSearchProfileFields,
) {
  const existing = await prisma.searchProfile.findFirst({
    where: { contactId, source: "declared" },
    orderBy: { updatedAt: "desc" },
  });

  const data = {
    intent: fields.intent,
    propertyType: fields.propertyType,
    zone: fields.zone,
    minPrice: toDecimal(fields.minPrice),
    maxPrice: toDecimal(fields.maxPrice),
    bedrooms: fields.bedrooms,
    bathrooms: fields.bathrooms,
    extra:
      fields.extra === null
        ? Prisma.DbNull
        : (fields.extra as Prisma.InputJsonValue),
  };

  if (existing) {
    await prisma.searchProfile.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.searchProfile.create({
      data: {
        contactId,
        source: "declared",
        ...data,
      },
    });
  }

  await refreshConversationalStageForContact(contactId);
  await syncContactDeclaredProfileJson(contactId);

  return prisma.searchProfile.findFirst({
    where: { contactId, source: "declared" },
    orderBy: { updatedAt: "desc" },
  });
}
