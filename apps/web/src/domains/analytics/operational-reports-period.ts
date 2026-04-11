/** Ventana de reportes operativos (F3-E6 / L17). */
export const OPERATIONAL_REPORT_PERIOD_OPTIONS = [7, 14, 30] as const;
export type OperationalReportPeriodDays = (typeof OPERATIONAL_REPORT_PERIOD_OPTIONS)[number];

export function parseOperationalReportPeriodDays(raw: string | undefined): OperationalReportPeriodDays {
  const n = raw != null ? Number.parseInt(String(raw).trim(), 10) : NaN;
  if (n === 7 || n === 14 || n === 30) return n;
  return 7;
}
