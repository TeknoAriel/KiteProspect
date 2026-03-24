import { prisma } from "@kite-prospect/db";

/**
 * Último consentimiento WhatsApp del contacto.
 * Si existe fila con `granted: false`, no se debe enviar (opt-out).
 */
export async function getWhatsAppSendBlockReason(contactId: string): Promise<string | null> {
  const c = await prisma.consent.findFirst({
    where: { contactId, channel: "whatsapp" },
    orderBy: { updatedAt: "desc" },
  });
  if (c && !c.granted) {
    return "El contacto optó por no recibir mensajes por WhatsApp.";
  }
  return null;
}
