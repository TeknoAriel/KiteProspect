/**
 * Contrato para la ejecución de ticks de seguimiento (S07).
 * La implementación vivirá en `services/`; el transporte puede ser Cron (MVP) o BullMQ (escala).
 *
 * @see docs/decisions/slice-s06-job-runner-followups.md
 */
export type ProcessDueFollowUpsInput = {
  /** Máximo de secuencias a evaluar en un tick (evita timeouts en serverless). */
  batchLimit?: number;
  /** Fecha simulada del tick (laboratorio / tests). Por defecto: ahora. */
  asOf?: Date;
  /** Si se define, solo secuencias cuyo contacto pertenece a esta cuenta (aislar laboratorio multi-tenant). */
  filterAccountId?: string;
};

export type ProcessDueFollowUpsResult = {
  sequencesExamined: number;
  attemptsCreated: number;
  skipped: number;
};
