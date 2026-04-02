/**
 * Marca la conversación como leída por el equipo (inbox) sin tocar `updatedAt`
 * (evita que el hilo salte al tope de la lista solo por abrirlo).
 */
import { prisma } from "@kite-prospect/db";
import { logStructured } from "@/lib/structured-log";

export async function markConversationReadByTeam(params: {
  conversationId: string;
  accountId: string;
}): Promise<void> {
  const now = new Date();
  await prisma.$executeRaw`
    UPDATE "Conversation"
    SET "lastReadAt" = ${now}
    WHERE "id" = ${params.conversationId} AND "accountId" = ${params.accountId}
  `;

  logStructured("inbox_conversation_marked_read", {
    accountId: params.accountId,
    conversationId: params.conversationId,
  });
}
