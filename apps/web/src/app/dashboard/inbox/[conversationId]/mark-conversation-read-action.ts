"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@kite-prospect/db";
import { markConversationReadByTeam } from "@/domains/conversations/mark-conversation-read";
import { revalidatePath } from "next/cache";

export async function markConversationReadAction(conversationId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.accountId) return;

  const exists = await prisma.conversation.findFirst({
    where: { id: conversationId, accountId: session.user.accountId },
    select: { id: true },
  });
  if (!exists) return;

  await markConversationReadByTeam({
    conversationId,
    accountId: session.user.accountId,
  });

  revalidatePath("/dashboard/inbox");
}
