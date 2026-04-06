/**
 * Matriz oficial de seguimiento por intensidad (fuente de verdad del core).
 * Cada fila: etapa del núcleo, objetivo, dato a obtener, pista de siguiente acción.
 * Ver `docs/seguimiento-y-cualificacion.md`.
 */
import type { FollowUpCoreStageKey } from "./follow-up-core-stages";
import { INTENSITY_DEFAULT_MAX_ATTEMPTS, type FollowUpIntensityKey } from "./follow-up-intensity";

export type OfficialMatrixRow = {
  stepIndex: number;
  coreStageKey: FollowUpCoreStageKey;
  objectiveEs: string;
  dataToObtainEs: string;
  nextActionHintEs: string;
};

const SOFT: OfficialMatrixRow[] = [
  {
    stepIndex: 0,
    coreStageKey: "activation",
    objectiveEs: "Activación: confirmar interés",
    dataToObtainEs: "Confirmación de interés o continuidad",
    nextActionHintEs: "Si responde, avanzar a enfoque; si no, bajar intensidad o cambiar canal",
  },
  {
    stepIndex: 1,
    coreStageKey: "focus",
    objectiveEs: "Enfoque: operación y tipo de propiedad",
    dataToObtainEs: "Operación (compra/alquiler) y tipología",
    nextActionHintEs: "Una pregunta por mensaje si hay poca respuesta",
  },
  {
    stepIndex: 2,
    coreStageKey: "qualification",
    objectiveEs: "Cualificación ligera: zona o rango",
    dataToObtainEs: "Zona preferida o rango de precio aproximado",
    nextActionHintEs: "No exigir todo; cerrar con dato útil",
  },
  {
    stepIndex: 3,
    coreStageKey: "reactivation",
    objectiveEs: "Reactivación o cierre: perfil guardado o subir a Normal",
    dataToObtainEs: "Estado comercial (seguimos / pausa / reactivar luego)",
    nextActionHintEs: "Marcar Reactivable o subir intensidad si hay engagement",
  },
];

const NORMAL: OfficialMatrixRow[] = [
  {
    stepIndex: 0,
    coreStageKey: "activation",
    objectiveEs: "Activación: confirmar interés",
    dataToObtainEs: "Interés activo en continuar",
    nextActionHintEs: "Canal de origen primero",
  },
  {
    stepIndex: 1,
    coreStageKey: "focus",
    objectiveEs: "Enfoque: operación, tipo, propiedad puntual o búsqueda abierta",
    dataToObtainEs: "Si busca algo concreto o está explorando",
    nextActionHintEs: "Ajustar tono según respuesta",
  },
  {
    stepIndex: 2,
    coreStageKey: "focus",
    objectiveEs: "Enfoque: zona ideal y zona aceptable",
    dataToObtainEs: "Zona ideal y alternativas",
    nextActionHintEs: "Registrar exclusiones si surgen",
  },
  {
    stepIndex: 3,
    coreStageKey: "qualification",
    objectiveEs: "Cualificación: rango de inversión",
    dataToObtainEs: "Rango presupuesto o señal de capacidad",
    nextActionHintEs: "Validar contra inventario sin prometer lo que no hay",
  },
  {
    stepIndex: 4,
    coreStageKey: "qualification",
    objectiveEs: "Cualificación: timing y bloqueos",
    dataToObtainEs: "Urgencia y bloqueos (crédito, terceros, venta previa)",
    nextActionHintEs: "Si bloqueado, flujo Bloqueado sin empujar cierre",
  },
  {
    stepIndex: 5,
    coreStageKey: "conversion",
    objectiveEs: "Conversión o seguimiento: asesor, opciones, seguir viendo",
    dataToObtainEs: "Próximo paso concreto (llamada, visita, más fichas)",
    nextActionHintEs: "Derivar si hay fit; reactivación si no hay match hoy",
  },
];

const STRONG: OfficialMatrixRow[] = [
  {
    stepIndex: 0,
    coreStageKey: "activation",
    objectiveEs: "Activación: confirmar continuidad",
    dataToObtainEs: "Disposición a seguir en el corto plazo",
    nextActionHintEs: "Subir ritmo solo con señal positiva",
  },
  {
    stepIndex: 1,
    coreStageKey: "focus",
    objectiveEs: "Enfoque: operación, tipo y zona",
    dataToObtainEs: "Operación, tipología y zona prioritaria",
    nextActionHintEs: "Cruzar con matches",
  },
  {
    stepIndex: 2,
    coreStageKey: "qualification",
    objectiveEs: "Cualificación: presupuesto",
    dataToObtainEs: "Rango o tope claro",
    nextActionHintEs: "Afinar contra stock",
  },
  {
    stepIndex: 3,
    coreStageKey: "qualification",
    objectiveEs: "Cualificación: timing",
    dataToObtainEs: "Ventana de decisión",
    nextActionHintEs: "Priorizar si timing corto",
  },
  {
    stepIndex: 4,
    coreStageKey: "qualification",
    objectiveEs: "Cualificación: bloqueos",
    dataToObtainEs: "Freno real (crédito, tercero, venta previa)",
    nextActionHintEs: "Registrar en perfil y tareas",
  },
  {
    stepIndex: 5,
    coreStageKey: "refinement",
    objectiveEs: "Afinado: flexibilidad, zona, alternativas",
    dataToObtainEs: "Qué puede ceder (precio, zona, estado)",
    nextActionHintEs: "Sugerir 1–3 u hasta 5 si match alto",
  },
  {
    stepIndex: 6,
    coreStageKey: "conversion",
    objectiveEs: "Conversión: llamada, visita, asesor o ficha",
    dataToObtainEs: "Compromiso de siguiente acción humana",
    nextActionHintEs: "Derivación prioritaria si match alto",
  },
  {
    stepIndex: 7,
    coreStageKey: "reactivation",
    objectiveEs: "Reactivación inteligente: opción nueva o perfil afinado",
    dataToObtainEs: "Motivo para volver a contactar",
    nextActionHintEs: "Nuevas propiedades o cambio de criterio",
  },
];

const PRIORITY: OfficialMatrixRow[] = [
  {
    stepIndex: 0,
    coreStageKey: "activation",
    objectiveEs: "Activación inmediata",
    dataToObtainEs: "Respuesta en el acto",
    nextActionHintEs: "Canal de origen y mejor histórico",
  },
  {
    stepIndex: 1,
    coreStageKey: "focus",
    objectiveEs: "Enfoque exacto",
    dataToObtainEs: "Criterios precisos de búsqueda",
    nextActionHintEs: "Minimizar ida y vuelta",
  },
  {
    stepIndex: 2,
    coreStageKey: "qualification",
    objectiveEs: "Presupuesto real",
    dataToObtainEs: "Cifra o banda cerrada",
    nextActionHintEs: "Validar contra inventario",
  },
  {
    stepIndex: 3,
    coreStageKey: "qualification",
    objectiveEs: "Timing real",
    dataToObtainEs: "Fecha límite o ventana",
    nextActionHintEs: "Alertar al equipo si es días",
  },
  {
    stepIndex: 4,
    coreStageKey: "qualification",
    objectiveEs: "Bloqueo real",
    dataToObtainEs: "Condición que frena el cierre",
    nextActionHintEs: "Tarea o derivación especializada",
  },
  {
    stepIndex: 5,
    coreStageKey: "refinement",
    objectiveEs: "Afinado",
    dataToObtainEs: "Últimos matices (amenities, exclusión)",
    nextActionHintEs: "Cerrar brecha con perfil",
  },
  {
    stepIndex: 6,
    coreStageKey: "conversion",
    objectiveEs: "Mostrar opciones concretas",
    dataToObtainEs: "Selección o descarte de fichas",
    nextActionHintEs: "Hasta 5 propiedades si el match lo permite",
  },
  {
    stepIndex: 7,
    coreStageKey: "conversion",
    objectiveEs: "Acción humana",
    dataToObtainEs: "Handoff explícito a asesor",
    nextActionHintEs: "Derivado / visita / llamada",
  },
  {
    stepIndex: 8,
    coreStageKey: "reactivation",
    objectiveEs: "Reactivación inteligente",
    dataToObtainEs: "Disparador futuro (stock, condición)",
    nextActionHintEs: "Programar toque si no cierra hoy",
  },
  {
    stepIndex: 9,
    coreStageKey: "conversion",
    objectiveEs: "Cierre operativo",
    dataToObtainEs: "Resultado del ciclo (pausa, ganado, descartado, derivado)",
    nextActionHintEs: "No insistir más allá del límite de intensidad sin nueva señal",
  },
];

export const OFFICIAL_MATRIX_BY_INTENSITY: Record<FollowUpIntensityKey, OfficialMatrixRow[]> = {
  soft: SOFT,
  normal: NORMAL,
  strong: STRONG,
  priority: PRIORITY,
};

export function getOfficialMatrixRow(
  intensity: FollowUpIntensityKey,
  stepIndex: number,
): OfficialMatrixRow | null {
  const rows = OFFICIAL_MATRIX_BY_INTENSITY[intensity];
  if (stepIndex < 0 || stepIndex >= rows.length) return null;
  return rows[stepIndex] ?? null;
}

/** Pasos esperados por intensidad (debe coincidir con INTENSITY_DEFAULT_MAX_ATTEMPTS). */
export function assertOfficialMatrixLengths(): void {
  for (const key of Object.keys(OFFICIAL_MATRIX_BY_INTENSITY) as FollowUpIntensityKey[]) {
    const n = OFFICIAL_MATRIX_BY_INTENSITY[key].length;
    const exp = INTENSITY_DEFAULT_MAX_ATTEMPTS[key];
    if (n !== exp) {
      throw new Error(`Matriz ${key}: ${n} filas, se esperaban ${exp}`);
    }
  }
}
