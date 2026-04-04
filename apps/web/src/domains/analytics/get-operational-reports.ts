/**
 * Agregados para la pantalla de reportes operativos (F2-E7, S34 + L3).
 */
import { prisma } from "@kite-prospect/db";
import { mean, median } from "./stats-median";

export type OperationalReports = {
  /** Ventana usada para "nuevos contactos" y SLA (días). */
  periodDays: number;
  newContactsInPeriod: number;
  /** Canal de la primera conversación del contacto (orden por createdAt). */
  newContactsByFirstChannel: { channel: string; count: number }[];
  conversationalStageCounts: { stage: string; count: number }[];
  /** Embudo comercial (todos los contactos del tenant). */
  commercialStageCounts: { stage: string; count: number }[];
  pendingTasksCount: number;
  activeFollowUpSequencesCount: number;
  /**
   * Primera respuesta del equipo: primer mensaje outbound después del primer inbound,
   * solo conversaciones cuya primera entrada está en el período (UTC).
   */
  firstResponseTime: {
    conversationsWithFirstInboundInPeriod: number;
    conversationsWithFirstOutboundAfterInbound: number;
    medianMinutesFirstResponse: number | null;
    meanMinutesFirstResponse: number | null;
  };
};

const DEFAULT_PERIOD_DAYS = 7;

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (typeof v === "bigint") return Number(v);
  return Number(v);
}

export async function getOperationalReportsForAccount(
  accountId: string,
  opts?: { periodDays?: number },
): Promise<OperationalReports> {
  const periodDays = opts?.periodDays ?? DEFAULT_PERIOD_DAYS;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - periodDays);
  since.setUTCHours(0, 0, 0, 0);

  const [
    newContactsInPeriod,
    newContactRows,
    convStageGroups,
    commercialStageGroups,
    pendingTasksCount,
    activeFollowUpSequencesCount,
    firstResponseRows,
    firstResponseCounts,
  ] = await Promise.all([
    prisma.contact.count({
      where: { accountId, createdAt: { gte: since } },
    }),
    prisma.contact.findMany({
      where: { accountId, createdAt: { gte: since } },
      select: {
        id: true,
        conversations: {
          select: { channel: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    }),
    prisma.contact.groupBy({
      by: ["conversationalStage"],
      where: { accountId },
      _count: { _all: true },
    }),
    prisma.contact.groupBy({
      by: ["commercialStage"],
      where: { accountId },
      _count: { _all: true },
    }),
    prisma.task.count({
      where: {
        status: "pending",
        contact: { accountId },
      },
    }),
    prisma.followUpSequence.count({
      where: {
        status: "active",
        contact: { accountId },
      },
    }),
    prisma.$queryRaw<{ minutes: unknown }[]>`
      WITH first_in AS (
        SELECT m."conversationId", MIN(m."createdAt") AS t_in
        FROM "Message" m
        INNER JOIN "Conversation" c ON c.id = m."conversationId"
        WHERE c."accountId" = ${accountId}
          AND m.direction = 'inbound'
        GROUP BY m."conversationId"
      ),
      first_out AS (
        SELECT m."conversationId", MIN(m."createdAt") AS t_out
        FROM "Message" m
        INNER JOIN first_in fi ON fi."conversationId" = m."conversationId"
        WHERE m.direction = 'outbound'
          AND m."createdAt" > fi.t_in
        GROUP BY m."conversationId"
      )
      SELECT EXTRACT(EPOCH FROM (fo.t_out - fi.t_in)) / 60.0 AS minutes
      FROM first_in fi
      INNER JOIN first_out fo ON fo."conversationId" = fi."conversationId"
      WHERE fi.t_in >= ${since}
    `,
    prisma.$queryRaw<{ inbound_in_period: bigint; with_reply: bigint }[]>`
      WITH first_in AS (
        SELECT m."conversationId", MIN(m."createdAt") AS t_in
        FROM "Message" m
        INNER JOIN "Conversation" c ON c.id = m."conversationId"
        WHERE c."accountId" = ${accountId}
          AND m.direction = 'inbound'
        GROUP BY m."conversationId"
      ),
      first_out AS (
        SELECT m."conversationId", MIN(m."createdAt") AS t_out
        FROM "Message" m
        INNER JOIN first_in fi ON fi."conversationId" = m."conversationId"
        WHERE m.direction = 'outbound'
          AND m."createdAt" > fi.t_in
        GROUP BY m."conversationId"
      )
      SELECT
        (SELECT COUNT(*)::bigint FROM first_in WHERE t_in >= ${since}) AS inbound_in_period,
        (
          SELECT COUNT(*)::bigint
          FROM first_in fi
          INNER JOIN first_out fo ON fo."conversationId" = fi."conversationId"
          WHERE fi.t_in >= ${since}
        ) AS with_reply
    `,
  ]);

  const byChannel = new Map<string, number>();
  for (const row of newContactRows) {
    const ch = row.conversations[0]?.channel ?? "sin_conversacion";
    byChannel.set(ch, (byChannel.get(ch) ?? 0) + 1);
  }
  const newContactsByFirstChannel = [...byChannel.entries()]
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => b.count - a.count);

  const conversationalStageCounts = convStageGroups
    .map((g) => ({
      stage: g.conversationalStage,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const commercialStageCounts = commercialStageGroups
    .map((g) => ({
      stage: g.commercialStage,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const minutesList = firstResponseRows.map((r) => toNum(r.minutes)).filter((m) => Number.isFinite(m));

  const countsRow = firstResponseCounts[0];
  const conversationsWithFirstInboundInPeriod = countsRow ? Number(countsRow.inbound_in_period) : 0;
  const conversationsWithFirstOutboundAfterInbound = countsRow ? Number(countsRow.with_reply) : 0;

  return {
    periodDays,
    newContactsInPeriod,
    newContactsByFirstChannel,
    conversationalStageCounts,
    commercialStageCounts,
    pendingTasksCount,
    activeFollowUpSequencesCount,
    firstResponseTime: {
      conversationsWithFirstInboundInPeriod,
      conversationsWithFirstOutboundAfterInbound,
      medianMinutesFirstResponse: median(minutesList),
      meanMinutesFirstResponse: mean(minutesList),
    },
  };
}
