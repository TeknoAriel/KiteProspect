import type { OperationalReports } from "./get-operational-reports";

function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(cells: string[]): string {
  return cells.map(csvCell).join(",");
}

/**
 * CSV UTF-8 con BOM para abrir bien en Excel (es-AR).
 */
export function buildOperationalReportsCsv(data: OperationalReports): string {
  const lines: string[] = [];
  lines.push(row(["seccion", "clave", "valor"]));
  lines.push(row(["resumen", "periodo_dias", String(data.periodDays)]));
  lines.push(row(["resumen", "nuevos_contactos", String(data.newContactsInPeriod)]));
  lines.push(row(["resumen", "tareas_pendientes", String(data.pendingTasksCount)]));
  lines.push(row(["resumen", "seguimientos_activos", String(data.activeFollowUpSequencesCount)]));
  lines.push(
    row([
      "sla",
      "conversaciones_primera_entrada_en_periodo",
      String(data.firstResponseTime.conversationsWithFirstInboundInPeriod),
    ]),
  );
  lines.push(
    row([
      "sla",
      "conversaciones_con_primera_respuesta",
      String(data.firstResponseTime.conversationsWithFirstOutboundAfterInbound),
    ]),
  );
  lines.push(
    row([
      "sla",
      "mediana_minutos_primera_respuesta",
      data.firstResponseTime.medianMinutesFirstResponse != null
        ? String(Math.round(data.firstResponseTime.medianMinutesFirstResponse * 100) / 100)
        : "",
    ]),
  );
  lines.push(
    row([
      "sla",
      "promedio_minutos_primera_respuesta",
      data.firstResponseTime.meanMinutesFirstResponse != null
        ? String(Math.round(data.firstResponseTime.meanMinutesFirstResponse * 100) / 100)
        : "",
    ]),
  );

  for (const r of data.newContactsByFirstChannel) {
    lines.push(row(["nuevos_por_canal_primer_hilo", r.channel, String(r.count)]));
  }
  for (const r of data.conversationalStageCounts) {
    lines.push(row(["embudo_conversacional", r.stage, String(r.count)]));
  }
  for (const r of data.commercialStageCounts) {
    lines.push(row(["embudo_comercial", r.stage, String(r.count)]));
  }

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}
