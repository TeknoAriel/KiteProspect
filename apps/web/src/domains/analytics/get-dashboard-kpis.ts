/**
 * Agregados para el dashboard del tenant (F1-E16 + S33 visibilidad operativa).
 * Sin analytics pesado: lecturas acotadas e index-friendly.
 */
import { prisma } from "@kite-prospect/db";

export type DashboardKpis = {
  contactsTotal: number;
  /** Contactos creados en los últimos `newContactsDays` días. */
  contactsNewInPeriod: number;
  newContactsDays: number;
  conversationsOpen: number;
  conversationsTotal: number;
  propertiesTotal: number;
  propertiesAvailable: number;
  /** Recuento por etapa comercial (pipeline), ordenado por volumen descendente. */
  commercialStageCounts: { stage: string; count: number }[];
  /** Conversaciones por canal de primera interacción (granularidad Conversation.channel). */
  channelCounts: { channel: string; count: number }[];
  /** Alta de contactos por día (UTC fecha), últimos 14 días incluyendo ceros. */
  newContactsByDay: { day: string; count: number }[];
  /** Últimos contactos creados (vista rápida). */
  recentContacts: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    commercialStage: string;
    createdAt: Date;
  }[];
};

const DEFAULT_NEW_DAYS = 7;
const TREND_DAYS = 14;
const RECENT_CONTACTS = 8;

function dayKeyFromRow(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getDashboardKpisForAccount(
  accountId: string,
  opts?: { newContactsDays?: number },
): Promise<DashboardKpis> {
  const newContactsDays = opts?.newContactsDays ?? DEFAULT_NEW_DAYS;
  const since = new Date();
  since.setDate(since.getDate() - newContactsDays);
  since.setHours(0, 0, 0, 0);

  const trendStart = new Date();
  trendStart.setUTCHours(0, 0, 0, 0);
  trendStart.setUTCDate(trendStart.getUTCDate() - (TREND_DAYS - 1));

  const [
    contactsTotal,
    contactsNewInPeriod,
    conversationsOpen,
    conversationsTotal,
    propertiesTotal,
    propertiesAvailable,
    stageGroups,
    channelGroups,
    recentContacts,
  ] = await Promise.all([
    prisma.contact.count({ where: { accountId } }),
    prisma.contact.count({
      where: { accountId, createdAt: { gte: since } },
    }),
    prisma.conversation.count({
      where: { accountId, status: "active" },
    }),
    prisma.conversation.count({ where: { accountId } }),
    prisma.property.count({ where: { accountId } }),
    prisma.property.count({
      where: { accountId, status: "available" },
    }),
    prisma.contact.groupBy({
      by: ["commercialStage"],
      where: { accountId },
      _count: { _all: true },
    }),
    prisma.conversation.groupBy({
      by: ["channel"],
      where: { accountId },
      _count: { _all: true },
    }),
    prisma.contact.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
      take: RECENT_CONTACTS,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        commercialStage: true,
        createdAt: true,
      },
    }),
  ]);

  const dayRows = await prisma.$queryRaw<{ d: Date; c: bigint }[]>`
    SELECT CAST("createdAt" AS date) AS d,
           COUNT(*)::bigint AS c
    FROM "Contact"
    WHERE "accountId" = ${accountId}
      AND "createdAt" >= ${trendStart}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const countByDay = new Map<string, number>();
  for (const row of dayRows) {
    countByDay.set(dayKeyFromRow(row.d), Number(row.c));
  }

  const newContactsByDay: { day: string; count: number }[] = [];
  for (let i = 0; i < TREND_DAYS; i++) {
    const d = new Date(trendStart.getTime());
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    newContactsByDay.push({ day: key, count: countByDay.get(key) ?? 0 });
  }

  const commercialStageCounts = stageGroups
    .map((g) => ({
      stage: g.commercialStage,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const channelCounts = channelGroups
    .map((g) => ({
      channel: g.channel,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    contactsTotal,
    contactsNewInPeriod,
    newContactsDays,
    conversationsOpen,
    conversationsTotal,
    propertiesTotal,
    propertiesAvailable,
    commercialStageCounts,
    channelCounts,
    newContactsByDay,
    recentContacts,
  };
}
