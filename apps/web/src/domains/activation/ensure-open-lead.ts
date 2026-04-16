import { prisma } from "@kite-prospect/db";

/**
 * Garantiza un Lead `open` o `qualified` (único por contacto) y vincula la conversación.
 */
export async function ensureOpenLeadForConversation(input: {
  accountId: string;
  contactId: string;
  conversationId: string;
  leadSource: string;
}): Promise<{ leadId: string; createdNewLead: boolean }> {
  const existing = await prisma.lead.findFirst({
    where: {
      contactId: input.contactId,
      status: { in: ["open", "qualified"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    await prisma.conversation.update({
      where: { id: input.conversationId },
      data: { leadId: existing.id },
    });
    return { leadId: existing.id, createdNewLead: false };
  }

  const lead = await prisma.lead.create({
    data: {
      accountId: input.accountId,
      contactId: input.contactId,
      status: "open",
      source: input.leadSource,
    },
  });

  await prisma.conversation.update({
    where: { id: input.conversationId },
    data: { leadId: lead.id },
  });

  return { leadId: lead.id, createdNewLead: true };
}
