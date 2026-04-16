import { prisma } from "@kite-prospect/db";
import type { EngagementSignals } from "./lead-qualification";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function loadEngagementSignals(
  contactId: string,
): Promise<EngagementSignals> {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY_MS);

  const [lastInbound, inbound30d] = await Promise.all([
    prisma.message.findFirst({
      where: {
        direction: "inbound",
        conversation: { contactId },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.message.count({
      where: {
        direction: "inbound",
        createdAt: { gte: since30 },
        conversation: { contactId },
      },
    }),
  ]);

  return {
    lastInboundAt: lastInbound?.createdAt ?? null,
    inboundCount30d: inbound30d,
    emailEngagementHit: false,
  };
}
