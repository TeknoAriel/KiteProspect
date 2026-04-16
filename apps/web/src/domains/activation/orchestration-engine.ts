/**
 * Motor IF/THEN determinístico (prioridad fija).
 * No muta BD; devuelve decisión para workers / auditoría.
 */

export type OrchestrationInput = {
  commercialStage: string;
  optOutAny: boolean;
  lastInboundAt: Date | null;
  lastOutboundAt: Date | null;
  hoursSinceLastInbound: number | null;
  qualifiedLeadPendingHandoff: boolean;
};

export type OrchestrationDecision =
  | { action: "stop"; reason: string }
  | { action: "prioritize_handoff"; reason: string }
  | { action: "continue_sequence"; reason: string; suggestChannelNote?: string }
  | { action: "fallback_email"; reason: string };

const NO_RESPONSE_HOURS = 72;

export function evaluateOrchestration(input: OrchestrationInput): OrchestrationDecision {
  if (input.optOutAny || input.commercialStage === "blocked") {
    return { action: "stop", reason: "R1: opt-out o commercialStage blocked" };
  }

  if (input.qualifiedLeadPendingHandoff) {
    return {
      action: "prioritize_handoff",
      reason: "R6: lead qualified — priorizar integration-outbound",
    };
  }

  if (input.hoursSinceLastInbound != null && input.hoursSinceLastInbound > NO_RESPONSE_HOURS) {
    return {
      action: "continue_sequence",
      reason: `R4: sin respuesta > ${NO_RESPONSE_HOURS}h — siguiente paso de secuencia`,
      suggestChannelNote: "evaluar WA si ventana; si no email",
    };
  }

  if (
    input.lastOutboundAt &&
    input.lastInboundAt &&
    input.lastInboundAt > input.lastOutboundAt
  ) {
    return {
      action: "continue_sequence",
      reason: "R5: hubo respuesta tras outbound — actualizar rama/score",
    };
  }

  return {
    action: "continue_sequence",
    reason: "default: mantener secuencia activa según plan",
  };
}
