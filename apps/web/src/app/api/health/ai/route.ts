/**
 * Salud del proveedor de IA (llamada real a Gemini/OpenAI vía planNextConversationAction).
 * Auth: mismo secreto que el cron — `Authorization: Bearer <CRON_SECRET>`.
 * Uso: verificación post-deploy sin sesión de usuario.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@kite-prospect/db";
import { planNextConversationAction } from "@/domains/ai-orchestration/plan-next-conversation-action";
import { verifyCronBearer } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET no configurado" },
      { status: 503 },
    );
  }

  if (!verifyCronBearer(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const conv = await prisma.conversation.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, accountId: true },
  });

  if (!conv) {
    return NextResponse.json(
      { ok: false, error: "No hay conversaciones en la base" },
      { status: 404 },
    );
  }

  const result = await planNextConversationAction({
    conversationId: conv.id,
    accountId: conv.accountId,
    actorUserId: null,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, conversationId: conv.id },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    conversationId: conv.id,
    actionKind: result.action.kind,
    model: result.model,
    promptVersion: result.promptVersion,
  });
}
