import type { NextConversationAction } from "./types";

/**
 * Valida y normaliza el JSON devuelto por el modelo.
 */
export function parseNextConversationAction(
  rawJson: string,
): NextConversationAction | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson) as unknown;
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  const kind = o.kind;

  if (kind === "reply") {
    const draft = o.draftReply;
    if (typeof draft !== "string" || !draft.trim()) return null;
    return { kind: "reply", draftReply: draft.trim() };
  }

  if (kind === "handoff") {
    if (typeof o.reason !== "string" || !o.reason.trim()) return null;
    return {
      kind: "handoff",
      reason: o.reason.trim(),
      summaryForHuman:
        typeof o.summaryForHuman === "string" && o.summaryForHuman.trim()
          ? o.summaryForHuman.trim()
          : undefined,
    };
  }

  if (kind === "noop") {
    if (typeof o.reason !== "string" || !o.reason.trim()) return null;
    return { kind: "noop", reason: o.reason.trim() };
  }

  return null;
}
