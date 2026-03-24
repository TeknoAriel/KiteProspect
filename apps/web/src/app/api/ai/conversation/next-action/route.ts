/**
 * Propone la siguiente acción conversacional estructurada (admin / coordinador).
 * Requiere proveedor IA configurado (Gemini/OpenAI).
 */
import { prisma } from "@kite-prospect/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { planNextConversationAction } from "@/domains/ai-orchestration/plan-next-conversation-action";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = new Set(["admin", "coordinator"]);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.role || !ALLOWED.has(session.user.role)) {
    return NextResponse.json(
      { error: "Solo administradores o coordinadores" },
      { status: 403 },
    );
  }

  let body: { conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  let conversationId =
    typeof body.conversationId === "string" ? body.conversationId.trim() : "";

  if (!conversationId) {
    const latest = await prisma.conversation.findFirst({
      where: { accountId: session.user.accountId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!latest) {
      return NextResponse.json(
        { error: "No hay conversaciones para evaluar en esta cuenta." },
        { status: 404 },
      );
    }
    conversationId = latest.id;
  }

  const result = await planNextConversationAction({
    conversationId,
    accountId: session.user.accountId,
    actorUserId: session.user.id,
  });

  if (!result.ok) {
    const configError =
      result.error.includes("OPENAI_API_KEY") ||
      result.error.includes("GEMINI_API_KEY") ||
      result.error.includes("AI_PROVIDER");
    return NextResponse.json(
      { error: result.error },
      { status: configError ? 503 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    action: result.action,
    model: result.model,
    promptVersion: result.promptVersion,
    modelSuggestedKind: result.modelSuggestedKind,
    appliedRuleIds: result.appliedRuleIds,
  });
}
