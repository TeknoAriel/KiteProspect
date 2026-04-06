/**
 * Ramas automáticas oficiales (comportamiento del lead → estrategia).
 * Motor futuro: reglas + score + consentimiento; hoy referencia de producto.
 */
export const FOLLOW_UP_BRANCH_KEYS = [
  "no_response",
  "low_response",
  "good_response",
  "blocked_lead",
  "high_match",
  "no_match_now",
] as const;

export type FollowUpBranchKey = (typeof FOLLOW_UP_BRANCH_KEYS)[number];

export function isFollowUpBranchKey(s: string): s is FollowUpBranchKey {
  return (FOLLOW_UP_BRANCH_KEYS as readonly string[]).includes(s);
}

export const FOLLOW_UP_BRANCH_LABEL_ES: Record<FollowUpBranchKey, string> = {
  no_response: "No responde",
  low_response: "Responde poco",
  good_response: "Responde bien",
  blocked_lead: "Lead bloqueado",
  high_match: "Match alto",
  no_match_now: "Sin match actual",
};

export function labelFollowUpBranch(key: string | null | undefined): string {
  if (!key) return "—";
  const k = key as FollowUpBranchKey;
  return FOLLOW_UP_BRANCH_LABEL_ES[k] ?? key;
}
