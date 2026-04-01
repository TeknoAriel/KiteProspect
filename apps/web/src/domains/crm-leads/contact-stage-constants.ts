/** Valores canónicos: `docs/product-rules.md` */

export const COMMERCIAL_STAGES = [
  "exploratory",
  "prospect",
  "real_lead",
  "blocked",
  "hot",
  "assigned",
  "visit_scheduled",
  "opportunity_active",
  "paused",
  "lost",
  "won",
] as const;

export type CommercialStage = (typeof COMMERCIAL_STAGES)[number];

export const CONVERSATIONAL_STAGES = [
  "new",
  "answered",
  "identified",
  "profiled_partial",
  "profiled_useful",
  "consent_obtained",
  "followup_active",
] as const;

export type ConversationalStage = (typeof CONVERSATIONAL_STAGES)[number];

export function isCommercialStage(s: string): s is CommercialStage {
  return (COMMERCIAL_STAGES as readonly string[]).includes(s);
}

export function isConversationalStage(s: string): s is ConversationalStage {
  return (CONVERSATIONAL_STAGES as readonly string[]).includes(s);
}
