/**
 * Contacto + Lead + matches listos para probar calificación automática (fit/intent altos).
 * Idempotente por email fijo.
 */
import type { PrismaClient } from "@prisma/client";

const ACTIVATION_EMAIL = "activation-seed@demo.local";

export async function ensureActivationDemo(
  prisma: PrismaClient,
  accountId: string,
): Promise<void> {
  const existing = await prisma.contact.findFirst({
    where: { accountId, email: ACTIVATION_EMAIL },
  });
  if (existing) return;

  const property = await prisma.property.findFirst({
    where: { accountId, status: "available" },
  });
  if (!property) {
    console.warn(
      "Seed activación: sin propiedades disponibles; se omite contacto demo de activación.",
    );
    return;
  }

  const contact = await prisma.contact.create({
    data: {
      accountId,
      email: ACTIVATION_EMAIL,
      name: "Lead Activación Demo",
      phone: "+5491112345678",
      commercialStage: "prospect",
      conversationalStage: "answered",
    },
  });

  await prisma.searchProfile.create({
    data: {
      contactId: contact.id,
      intent: "compra",
      propertyType: "departamento",
      zone: property.zone,
      maxPrice: property.price,
      source: "declared",
    },
  });

  await prisma.propertyMatch.create({
    data: {
      contactId: contact.id,
      propertyId: property.id,
      score: 85,
      reason: "seed activación",
    },
  });

  const lead = await prisma.lead.create({
    data: {
      accountId,
      contactId: contact.id,
      status: "open",
      source: "seed_activation",
    },
  });

  const conv = await prisma.conversation.create({
    data: {
      accountId,
      contactId: contact.id,
      leadId: lead.id,
      channel: "form",
      status: "active",
    },
  });

  for (const content of [
    "Hola, busco deptos en la zona",
    "Mi presupuesto es acorde, quiero coordinar visita",
  ]) {
    await prisma.message.create({
      data: {
        conversationId: conv.id,
        direction: "inbound",
        content,
        channel: "form",
      },
    });
  }

  for (const channel of ["email", "whatsapp"] as const) {
    await prisma.consent.create({
      data: {
        contactId: contact.id,
        channel,
        granted: true,
        grantedAt: new Date(),
        purpose: "marketing",
      },
    });
  }

  console.log(
    `Seed activación: contacto ${ACTIVATION_EMAIL} + lead ${lead.id} (listo para scoring/cualificación).`,
  );
}
