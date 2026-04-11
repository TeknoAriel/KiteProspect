import { prisma } from "@kite-prospect/db";

/**
 * Bloqueo de envío por SMS si el último consentimiento explícito es opt-out.
 */
export async function getSmsSendBlockReason(contactId: string): Promise<string | null> {
  const c = await prisma.consent.findFirst({
    where: { contactId, channel: "sms" },
    orderBy: { updatedAt: "desc" },
  });
  if (c && !c.granted) {
    return "El contacto optó por no recibir SMS.";
  }
  return null;
}
