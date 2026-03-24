import type { NextConversationAction } from "./types";

export type HandoffRuleContext = {
  commercialStage: string;
  channel: string;
  /** Motivo de bloqueo WhatsApp (opt-out) o null. */
  whatsappBlockReason: string | null;
  /** Último mensaje entrante del lead, en minúsculas (vacío si no hay). */
  lastInboundLowercase: string;
};

/**
 * Reglas de negocio determinísticas aplicadas **después** del modelo.
 * Solo pueden forzar handoff cuando el modelo devolvió reply o noop.
 */
export function applyHandoffRules(
  action: NextConversationAction,
  ctx: HandoffRuleContext,
): { action: NextConversationAction; appliedRuleIds: string[] } {
  if (action.kind === "handoff") {
    return { action, appliedRuleIds: [] };
  }

  if (ctx.commercialStage === "blocked") {
    return {
      action: {
        kind: "handoff",
        reason:
          "Regla interna: el lead está en etapa comercial bloqueada; debe revisar un humano.",
      },
      appliedRuleIds: ["commercial_stage_blocked"],
    };
  }

  if (
    ctx.channel === "whatsapp" &&
    ctx.whatsappBlockReason &&
    (action.kind === "reply" || action.kind === "noop")
  ) {
    return {
      action: {
        kind: "handoff",
        reason: `Regla interna (WhatsApp): ${ctx.whatsappBlockReason}`,
        summaryForHuman: ctx.whatsappBlockReason,
      },
      appliedRuleIds: ["whatsapp_opt_out"],
    };
  }

  const t = ctx.lastInboundLowercase;
  if (t && /(reclamo|demanda|abogad|denunci|fraude|estafa|judicial|juicio)/.test(t)) {
    return {
      action: {
        kind: "handoff",
        reason:
          "Regla interna: el mensaje sugiere tema sensible o legal; escalar a humano.",
        summaryForHuman: t.slice(0, 240),
      },
      appliedRuleIds: ["sensitive_or_legal_keywords"],
    };
  }

  if (
    t &&
    /(hablar con (un |una )?(humano|asesor|persona|agente|vendedor)|quiero (hablar con |una )?(persona|humano|asesor|alguien)|conéctame con|poneme con|derivación|operador)/.test(
      t,
    )
  ) {
    return {
      action: {
        kind: "handoff",
        reason:
          "Regla interna: el lead pidió explícitamente contacto humano.",
      },
      appliedRuleIds: ["explicit_human_request"],
    };
  }

  return { action, appliedRuleIds: [] };
}
