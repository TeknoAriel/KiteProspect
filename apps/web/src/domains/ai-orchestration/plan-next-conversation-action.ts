/**
 * Orquesta contexto de conversación y llama al proveedor de IA (salida estructurada).
 */
import { prisma } from "@kite-prospect/db";
import { recordAuditEvent } from "@/lib/audit";
import { callAIProviderJson } from "./provider-chat-json";
import { parseNextConversationAction } from "./parse-next-action";
import type { PlanNextConversationActionResult } from "./types";

const PROMPT_VERSION = "s10-v1";

const SYSTEM_PROMPT = `Eres el asistente conversacional de una inmobiliaria (Kite Prospect).
Tu salida debe ser SIEMPRE un único objeto JSON válido (sin markdown, sin texto fuera del JSON).

Esquema obligatorio:
- {"kind":"reply","draftReply":"..."} — cuando conviene responder al lead con un mensaje corto y útil.
- {"kind":"handoff","reason":"...","summaryForHuman":"..."} — cuando debe intervenir un humano (opcional summaryForHuman).
- {"kind":"noop","reason":"..."} — cuando no corresponde responder automáticamente.

Reglas:
- No inventes propiedades, precios ni disponibilidad: solo usa lo que aparece en el contexto.
- No actualices bases de datos ni pidas datos sensibles fuera de tono comercial.
- Redacta en español neutro (Latam) salvo que el lead escriba en otro idioma; en ese caso, coherente con el lead.
- draftReply: máximo ~800 caracteres si es posible.`;

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

  const ai = await callAIProviderJson({
    system: SYSTEM_PROMPT,
    user: userPrompt,
    maxTokens: 700,
    temperature: 0.35,
  });

  if (!ai.ok) {
    return { ok: false, error: ai.error };
  }

  const action = parseNextConversationAction(ai.content);
  if (!action) {
    return {
      ok: false,
      error: "La IA devolvió JSON inválido o no reconocido.",
    };
  }

  await recordAuditEvent({
    accountId: params.accountId,
    entityType: "conversation",
    entityId: params.conversationId,
    action: "ai_next_action_planned",
    actorId: params.actorUserId ?? undefined,
    actorType: "user",
    metadata: {
      promptVersion: PROMPT_VERSION,
      model: ai.model,
      provider: ai.provider,
      actionKind: action.kind,
    },
  });

  return {
    ok: true,
    action,
    model: ai.model,
    promptVersion: PROMPT_VERSION,
  };
}
