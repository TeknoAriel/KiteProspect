/**
 * Agregados para la pantalla de reportes operativos (F2-E7 paso, S34).
 */
import { prisma } from "@kite-prospect/db";

export type OperationalReports = {
  /** Ventana usada para "nuevos contactos" (días). */
  periodDays: number;
  newContactsInPeriod: number;
  /** Canal de la primera conversación del contacto (orden por createdAt). */
  newContactsByFirstChannel: { channel: string; count: number }[];
  conversationalStageCounts: { stage: string; count: number }[];
  pendingTasksCount: number;
  activeFollowUpSequencesCount: number;
};

const DEFAULT_PERIOD_DAYS = 7;

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
    pendingTasksCount,
    activeFollowUpSequencesCount,
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

  return {
    periodDays,
    newContactsInPeriod,
    newContactsByFirstChannel,
    conversationalStageCounts,
    pendingTasksCount,
    activeFollowUpSequencesCount,
  };
}
