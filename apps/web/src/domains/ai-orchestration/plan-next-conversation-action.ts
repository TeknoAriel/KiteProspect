/**
 * Orquesta contexto de conversación y llama al proveedor de IA (salida estructurada).
 * S11: reglas de handoff determinísticas después del modelo + prompt versionado.
 */
import { prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { getWhatsAppSendBlockReason } from "@/domains/integrations/whatsapp/whatsapp-consent";
import { applyHandoffRules } from "./handoff-rules";
import { callAIProviderJson } from "./provider-chat-json";
import {
  getConversationPromptVersion,
  getConversationSystemPrompt,
} from "./prompt-config";
import { parseNextConversationAction } from "./parse-next-action";
import type { PlanNextConversationActionResult } from "./types";

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export async function planNextConversationAction(params: {
  conversationId: string;
  accountId: string;
  actorUserId?: string | null;
}): Promise<PlanNextConversationActionResult> {
  const conv = await prisma.conversation.findFirst({
    where: { id: params.conversationId, accountId: params.accountId },
    include: {
      contact: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 30,
      },
    },
  });

  if (!conv) {
    return { ok: false, error: "Conversación no encontrada." };
  }

  const declared = conv.contact.declaredProfile;
  const declaredStr =
    declared === null || declared === undefined
      ? "(sin perfil declarado en JSON)"
      : truncate(JSON.stringify(declared), 1200);

  const lines: string[] = [
    `Contacto: ${conv.contact.name ?? "(sin nombre)"}`,
    `Tel: ${conv.contact.phone ?? "-"} | Email: ${conv.contact.email ?? "-"}`,
    `Etapa conversacional: ${conv.contact.conversationalStage} | Comercial: ${conv.contact.commercialStage}`,
    `Canal conversación: ${conv.channel}`,
    `Perfil declarado (JSON resumido): ${declaredStr}`,
    "",
    "Últimos mensajes (orden cronológico):",
  ];

  for (const m of conv.messages) {
    const dir = m.direction === "inbound" ? "LEAD" : "EQUIPO";
    lines.push(`[${dir}] ${truncate(m.content, 2000)}`);
  }

  const userPrompt = lines.join("\n");

  const promptVersion = getConversationPromptVersion();
  const systemPrompt = getConversationSystemPrompt();

  const ai = await callAIProviderJson({
    system: systemPrompt,
    user: userPrompt,
    maxTokens: 700,
    temperature: 0.35,
  });

  if (!ai.ok) {
    return { ok: false, error: ai.error };
  }

  const modelAction = parseNextConversationAction(ai.content);
  if (!modelAction) {
    return {
      ok: false,
      error: "La IA devolvió JSON inválido o no reconocido.",
    };
  }

  const modelSuggestedKind = modelAction.kind;

  const lastInbound = [...conv.messages]
    .reverse()
    .find((m) => m.direction === "inbound");
  const lastInboundLowercase = (lastInbound?.content ?? "").toLowerCase();

  const whatsappBlock =
    conv.channel === "whatsapp"
      ? await getWhatsAppSendBlockReason(conv.contactId)
      : null;

  const { action: finalAction, appliedRuleIds } = applyHandoffRules(
    modelAction,
    {
      commercialStage: conv.contact.commercialStage,
      channel: conv.channel,
      whatsappBlockReason: whatsappBlock,
      lastInboundLowercase,
    },
  );

  await recordAuditEvent({
    accountId: params.accountId,
    entityType: "conversation",
    entityId: params.conversationId,
    action: "ai_next_action_planned",
    actorId: params.actorUserId ?? undefined,
    actorType: "user",
    metadata: {
      promptVersion,
      model: ai.model,
      provider: ai.provider,
      modelSuggestedKind,
      finalKind: finalAction.kind,
      appliedRuleIds,
    },
  });

  if (appliedRuleIds.length > 0 && finalAction.kind === "handoff") {
    await recordAuditEvent({
      accountId: params.accountId,
      entityType: "conversation",
      entityId: params.conversationId,
      action: "ai_handoff_rules_applied",
      actorId: params.actorUserId ?? undefined,
      actorType: "user",
      metadata: {
        ruleIds: appliedRuleIds,
        modelSuggestedKind,
        reason: finalAction.reason,
      },
    });
  }

  return {
    ok: true,
    action: finalAction,
    model: ai.model,
    promptVersion,
    modelSuggestedKind,
    appliedRuleIds,
  };
}
