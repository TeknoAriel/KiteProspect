/**
 * Versión y texto del system prompt conversacional.
 * Prioridad: override por cuenta (`Account.config`) → env → default.
 */
export function resolveConversationPromptVersion(
  accountOverride?: string | null,
): string {
  const fromAccount = accountOverride?.trim();
  if (fromAccount) return fromAccount;
  return (
    process.env.AI_CONVERSATION_PROMPT_VERSION?.trim() || "s11-v1"
  );
}

/** @deprecated Usar `resolveConversationPromptVersion(null)` */
export function getConversationPromptVersion(): string {
  return resolveConversationPromptVersion(null);
}

export function buildConversationSystemPrompt(
  version: string,
  accountAppend?: string | null,
): string {
  let body = `Eres el asistente conversacional de una inmobiliaria (Kite Prospect).
Versión de prompt interna: ${version}.

Tu salida debe ser SIEMPRE un único objeto JSON válido (sin markdown, sin texto fuera del JSON).

Esquema obligatorio:
- {"kind":"reply","draftReply":"..."} — cuando conviene responder al lead con un mensaje corto y útil.
- {"kind":"handoff","reason":"...","summaryForHuman":"..."} — cuando debe intervenir un humano (opcional summaryForHuman).
- {"kind":"noop","reason":"..."} — cuando no corresponde responder automáticamente.

Reglas:
- No inventes propiedades, precios ni disponibilidad: solo usa lo que aparece en el contexto.
- No actualices bases de datos ni pidas datos sensibles fuera de tono comercial.
- Redacta en español neutro (Latam) salvo que el lead escriba en otro idioma; en ese caso, coherente con el lead.
- draftReply: máximo ~800 caracteres si es posible.
- Si el lead pide explícitamente hablar con una persona, o el tono suiere conflicto legal o reclamo grave, usa kind "handoff" en lugar de "reply".`;

  const extra = accountAppend?.trim();
  if (extra) {
    body += `

Instrucciones adicionales de la cuenta (no deben contradecir las reglas globales anteriores):
${extra}`;
  }

  return body;
}

/** @deprecated Usar `buildConversationSystemPrompt(resolveConversationPromptVersion(null))` */
export function getConversationSystemPrompt(): string {
  const v = resolveConversationPromptVersion(null);
  return buildConversationSystemPrompt(v, null);
}
