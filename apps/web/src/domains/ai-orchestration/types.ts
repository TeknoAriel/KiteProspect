/**
 * Contrato de salida estructurada del motor conversacional (F1-E9).
 * La IA no muta entidades directamente: solo propone la siguiente acción.
 */

export type NextConversationAction =
  | {
      kind: "reply";
      /** Borrador de respuesta al lead (validación humana / envío posterior). */
      draftReply: string;
    }
  | {
      kind: "handoff";
      reason: string;
      summaryForHuman?: string;
    }
  | {
      kind: "noop";
      reason: string;
    };

export type PlanNextConversationActionResult =
  | { ok: true; action: NextConversationAction; model: string; promptVersion: string }
  | { ok: false; error: string };
