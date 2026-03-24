/**
 * Prueba local del motor conversacional (misma lógica que POST /api/ai/conversation/next-action).
 * Uso desde la raíz del monorepo: npm run test:ai
 *
 * Requiere en .env: DATABASE_URL, AI_PROVIDER, y clave del proveedor (ej. GEMINI_API_KEY).
 */
import { prisma } from "@kite-prospect/db";
import { planNextConversationAction } from "@/domains/ai-orchestration/plan-next-conversation-action";

async function main() {
  const conv = await prisma.conversation.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, accountId: true },
  });

  if (!conv) {
    console.error("No hay conversaciones en la base. Ejecutá seed o creá datos.");
    process.exit(1);
  }

  console.log("Conversación:", conv.id, "cuenta:", conv.accountId);

  const result = await planNextConversationAction({
    conversationId: conv.id,
    accountId: conv.accountId,
    actorUserId: null,
  });

  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
