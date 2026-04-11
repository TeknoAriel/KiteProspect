/**
 * Agregados para la pantalla de reportes operativos (F2-E7, S34 + L3; F3-E4+ filtro sucursal L19).
 */
import type { Session } from "next-auth";
import { prisma, Prisma } from "@kite-prospect/db";
import { getOperationalContactWhere } from "./operational-reports-scope";
import { mean, median } from "./stats-median";

export type CohortRollingWeekRow = {
  /** Etiqueta legible (ej. últimos 7 días). */
  label: string;
  /** Inicio UTC inclusivo del bucket. */
  rangeStartUtc: string;
  /** Fin UTC exclusivo del bucket. */
  rangeEndUtc: string;
  newContacts: number;
};

export type OperationalReports = {
  /** Ventana usada para "nuevos contactos" y SLA (días). */
  periodDays: number;
  /** Sucursal (F3-E4+); null = todo el tenant. */
  branchFilter: { id: string; name: string; slug: string } | null;
  newContactsInPeriod: number;
  /**
   * Cohorte de altas por ventanas de 7 días (UTC, “últimos 7 días”, “8–14 días atrás”, …).
   * F3-E6: lectura de tendencia sin BI infinito.
   */
  cohortRollingWeeks: CohortRollingWeekRow[];
  /** Canal de la primera conversación del contacto (orden por createdAt). */
  newContactsByFirstChannel: { channel: string; count: number }[];
  conversationalStageCounts: { stage: string; count: number }[];
  /** Embudo comercial (contactos en el alcance del reporte). */
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
const MS_DAY = 86_400_000;

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (typeof v === "bigint") return Number(v);
  return Number(v);
}

/** Cuatro ventanas de 7 días hacia atrás desde `nowUtc` (fin exclusivo = inicio del siguiente bucket). */
export async function countNewContactsByRollingWeekBuckets(
  accountId: string,
  nowUtc: Date,
  branchId: string | undefined,
  session: Session,
): Promise<CohortRollingWeekRow[]> {
  const labels = [
    "Últimos 7 días",
    "8–14 días atrás",
    "15–21 días atrás",
    "22–28 días atrás",
  ] as const;

  const ranges = labels.map((label, w) => {
    const rangeEnd = new Date(nowUtc.getTime() - w * 7 * MS_DAY);
    const rangeStart = new Date(nowUtc.getTime() - (w + 1) * 7 * MS_DAY);
    return { label, rangeStart, rangeEnd };
  });

  const cw = getOperationalContactWhere(accountId, branchId, session);

  const counts = await Promise.all(
    ranges.map((r) =>
      prisma.contact.count({
        where: {
          ...cw,
          createdAt: { gte: r.rangeStart, lt: r.rangeEnd },
        },
      }),
    ),
  );

  return ranges.map((r, i) => ({
    label: r.label,
    rangeStartUtc: r.rangeStart.toISOString(),
    rangeEndUtc: r.rangeEnd.toISOString(),
    newContacts: counts[i]!,
  }));
}

/** Filtro SQL sobre `Contact co` en JOINs de reportes: sucursal UI y/o alcance asesor. */
function branchSqlFilter(branchId: string | undefined, session: Session): Prisma.Sql {
  if (branchId) {
    return Prisma.sql`AND co."branchId" = ${branchId}`;
  }
  if (session.user.role === "advisor" && session.user.advisorBranchId) {
    const bid = session.user.advisorBranchId;
    return Prisma.sql`AND (co."branchId" IS NULL OR co."branchId" = ${bid})`;
  }
  return Prisma.empty;
}

export async function getOperationalReportsForAccount(
  accountId: string,
  opts: {
    session: Session;
    periodDays?: number;
    branchId?: string;
    branchFilter?: { id: string; name: string; slug: string } | null;
  },
): Promise<OperationalReports> {
  const periodDays = opts.periodDays ?? DEFAULT_PERIOD_DAYS;
  const branchId = opts.branchId;
  const branchFilter = opts.branchFilter ?? null;
  const { session } = opts;
  const cw = getOperationalContactWhere(accountId, branchId, session);
  const bf = branchSqlFilter(branchId, session);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - periodDays);
  since.setUTCHours(0, 0, 0, 0);

  const firstResponseRows = await prisma.$queryRaw<{ minutes: unknown }[]>(
    Prisma.sql`
      WITH first_in AS (
        SELECT m."conversationId", MIN(m."createdAt") AS t_in
        FROM "Message" m
        INNER JOIN "Conversation" c ON c.id = m."conversationId"
        INNER JOIN "Contact" co ON co.id = c."contactId"
        WHERE c."accountId" = ${accountId}
          AND co."accountId" = ${accountId}
          AND m.direction = 'inbound'
          ${bf}
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
  );

  const firstResponseCounts = await prisma.$queryRaw<{ inbound_in_period: bigint; with_reply: bigint }[]>(
    Prisma.sql`
      WITH first_in AS (
        SELECT m."conversationId", MIN(m."createdAt") AS t_in
        FROM "Message" m
        INNER JOIN "Conversation" c ON c.id = m."conversationId"
        INNER JOIN "Contact" co ON co.id = c."contactId"
        WHERE c."accountId" = ${accountId}
          AND co."accountId" = ${accountId}
          AND m.direction = 'inbound'
          ${bf}
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
  );

  const [
    newContactsInPeriod,
    newContactRows,
    convStageGroups,
    commercialStageGroups,
    pendingTasksCount,
    activeFollowUpSequencesCount,
    cohortRollingWeeks,
  ] = await Promise.all([
    prisma.contact.count({
      where: { ...cw, createdAt: { gte: since } },
    }),
    prisma.contact.findMany({
      where: { ...cw, createdAt: { gte: since } },
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
      where: cw,
      _count: { _all: true },
    }),
    prisma.contact.groupBy({
      by: ["commercialStage"],
      where: cw,
      _count: { _all: true },
    }),
    prisma.task.count({
      where: {
        status: "pending",
        contact: cw,
      },
    }),
    prisma.followUpSequence.count({
      where: {
        status: "active",
        contact: cw,
      },
    }),
    countNewContactsByRollingWeekBuckets(accountId, new Date(), branchId, session),
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
    branchFilter,
    newContactsInPeriod,
    cohortRollingWeeks,
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
