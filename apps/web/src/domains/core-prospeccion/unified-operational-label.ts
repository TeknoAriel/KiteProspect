/**
 * Estado operativo unificado (vista humana) a partir de pares conv/comercial.
 * No sustituye columnas; prioriza lectura comercial y bloqueos.
 * Ver `docs/estados-y-etiquetas.md`.
 */

export type UnifiedOperationalLabel =
  | "NUEVO"
  | "CONTACTADO"
  | "EN CONVERSACIÓN"
  | "PERFIL INCOMPLETO"
  | "PERFIL ÚTIL"
  | "EN SEGUIMIENTO"
  | "CON INTERÉS"
  | "CALIFICADO"
  | "BLOQUEADO"
  | "EN PAUSA"
  | "REACTIVABLE"
  | "DERIVADO"
  | "DESCARTADO"
  | "CERRADO";

/**
 * Resuelve una etiqueta única para cabecera / badge.
 * `REACTIVABLE` puede asignarse en Fase 2 cuando exista señal explícita (ej. tarea de reactivación).
 */
export function resolveUnifiedOperationalLabel(
  conversationalStage: string,
  commercialStage: string,
  opts?: { reactivableHint?: boolean },
): UnifiedOperationalLabel {
  const com = commercialStage;
  const conv = conversationalStage;

  if (com === "won") return "CERRADO";
  if (com === "lost") return "DESCARTADO";
  if (com === "paused") return "EN PAUSA";
  if (com === "blocked") return "BLOQUEADO";
  if (com === "assigned" || com === "visit_scheduled") return "DERIVADO";
  if (com === "hot") return "CON INTERÉS";
  if (com === "real_lead" || com === "opportunity_active") return "CALIFICADO";
  if (com === "prospect") return "CON INTERÉS";

  if (opts?.reactivableHint) return "REACTIVABLE";

  if (conv === "followup_active" || conv === "consent_obtained") return "EN SEGUIMIENTO";
  if (conv === "profiled_useful") return "PERFIL ÚTIL";
  if (conv === "profiled_partial") return "PERFIL INCOMPLETO";
  if (conv === "identified") return "EN CONVERSACIÓN";
  if (conv === "answered") return "CONTACTADO";
  if (conv === "new") return "NUEVO";

  return "EN CONVERSACIÓN";
}
