/**
 * Servicio: crear contacto automáticamente desde canal
 * MVP: lógica básica
 * TODO Fase 2: validaciones más estrictas, deduplicación mejorada
 */
import { prisma } from "@kite-prospect/db";

interface CreateContactInput {
  accountId: string;
  email?: string;
  phone?: string;
  name?: string;
  channel: string;
  message?: string;
  channelId?: string;
}

export async function createContactFromChannel(input: CreateContactInput) {
  const { accountId, email, phone, name, channel, message, channelId } = input;

  // Buscar contacto existente
  let contact = await prisma.contact.findFirst({
    where: {
      accountId,
      OR: [
        email ? { email } : {},
        phone ? { phone } : {},
      ].filter((c) => Object.keys(c).length > 0),
    },
  });

  // Crear si no existe
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        accountId,
        email: email || null,
        phone: phone || null,
        name: name || null,
        conversationalStage: "new",
        commercialStage: "exploratory",
      },
    });
  }

  // Crear o encontrar conversación
  let conversation = await prisma.conversation.findFirst({
    where: {
      accountId,
      contactId: contact.id,
      channel,
      status: "active",
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        accountId,
        contactId: contact.id,
        channel,
        channelId: channelId || null,
        status: "active",
      },
    });
  }

  // Crear mensaje si existe
  if (message) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        direction: "inbound",
        content: message,
        channel,
      },
    });

    // Actualizar estado
    if (contact.conversationalStage === "new") {
      await prisma.contact.update({
        where: { id: contact.id },
        data: { conversationalStage: "answered" },
      });
    }
  }

  return { contact, conversation };
}
