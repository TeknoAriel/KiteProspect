/**
 * Servicio: actualizar perfil declarado del contacto
 * MVP: lógica básica
 * TODO Fase 2: validaciones más estrictas, inferencia automática
 */
import type { Prisma } from "@kite-prospect/db";
import { prisma } from "@kite-prospect/db";

interface UpdateProfileInput {
  contactId: string;
  intent?: string;
  propertyType?: string;
  zone?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  extra?: Record<string, unknown>;
}

function toProfileFields(input: UpdateProfileInput): Omit<UpdateProfileInput, "contactId"> {
  const { contactId: _c, ...rest } = input;
  return rest;
}

function jsonExtra(
  extra: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  if (extra === undefined) return undefined;
  return extra as Prisma.InputJsonValue;
}

export async function updateSearchProfile(input: UpdateProfileInput) {
  const { contactId } = input;
  const profileData = toProfileFields(input);

  // Buscar perfil existente o crear nuevo
  const existing = await prisma.searchProfile.findFirst({
    where: {
      contactId,
      source: "declared",
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    // Actualizar existente
    const { extra, ...scalarFields } = profileData;
    const updated = await prisma.searchProfile.update({
      where: { id: existing.id },
      data: {
        ...scalarFields,
        ...(extra !== undefined ? { extra: jsonExtra(extra) } : {}),
        updatedAt: new Date(),
      },
    });

    // Actualizar estado conversacional si hay datos útiles
    await updateConversationalStage(contactId);

    return updated;
  } else {
    // Crear nuevo
    const { extra, ...scalarFields } = profileData;
    const created = await prisma.searchProfile.create({
      data: {
        contactId,
        source: "declared",
        ...scalarFields,
        ...(extra !== undefined ? { extra: jsonExtra(extra) } : {}),
      },
    });

    // Actualizar estado conversacional
    await updateConversationalStage(contactId);

    return created;
  }
}

async function updateConversationalStage(contactId: string) {
  const profile = await prisma.searchProfile.findFirst({
    where: { contactId },
    orderBy: { updatedAt: "desc" },
  });

  if (!profile) return;

  // Determinar si el perfil es "útil" (tiene datos suficientes)
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
