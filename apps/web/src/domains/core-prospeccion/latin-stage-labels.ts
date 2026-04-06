/**
 * Etiquetas en español (Latino) para UI; claves internas siguen en inglés.
 * Ver `docs/estados-y-etiquetas.md`.
 */
import type { CommercialStage, ConversationalStage } from "@/domains/crm-leads/contact-stage-constants";

export const COMMERCIAL_STAGE_LABEL_ES: Record<CommercialStage, string> = {
  exploratory: "Exploratorio",
  prospect: "Interés / prospecto",
  real_lead: "Lead real",
  blocked: "Bloqueado",
  hot: "Oportunidad caliente",
  assigned: "Derivado",
  visit_scheduled: "Visita agendada",
  opportunity_active: "Oportunidad activa",
  paused: "En pausa",
  lost: "Descartado",
  won: "Cerrado / ganado",
};

export const CONVERSATIONAL_STAGE_LABEL_ES: Record<ConversationalStage, string> = {
  new: "Nuevo",
  answered: "Contactado",
  identified: "En conversación",
  profiled_partial: "Perfil incompleto",
  profiled_useful: "Perfil útil",
  consent_obtained: "Consentimiento",
  followup_active: "En seguimiento",
};
