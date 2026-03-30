/**
 * Agregados mínimos para el dashboard del tenant (F1-E16).
 * Sin analytics pesado: solo lecturas acotadas e index-friendly.
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
};

const DEFAULT_NEW_DAYS = 7;

export async function getDashboardKpisForAccount(
  accountId: string,
  opts?: { newContactsDays?: number },
): Promise<DashboardKpis> {
  const newContactsDays = opts?.newContactsDays ?? DEFAULT_NEW_DAYS;
  const since = new Date();
  since.setDate(since.getDate() - newContactsDays);
  since.setHours(0, 0, 0, 0);

  const [
    contactsTotal,
    contactsNewInPeriod,
    conversationsOpen,
    conversationsTotal,
    propertiesTotal,
    propertiesAvailable,
    stageGroups,
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
  ]);

  const commercialStageCounts = stageGroups
    .map((g) => ({
      stage: g.commercialStage,
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
  };
}
