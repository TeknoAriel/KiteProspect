import { prisma } from "@kite-prospect/db";

/**
 * Bloqueo de envío por email si el último consentimiento explícito es opt-out.
 */
export async function getEmailSendBlockReason(contactId: string): Promise<string | null> {
  const c = await prisma.consent.findFirst({
    where: { contactId, channel: "email" },
    orderBy: { updatedAt: "desc" },
  });
  if (c && !c.granted) {
    return "El contacto optó por no recibir emails.";
  }
  return null;
}
