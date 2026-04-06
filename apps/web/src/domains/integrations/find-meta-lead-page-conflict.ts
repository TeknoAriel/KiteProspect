import type { PrismaClient } from "@kite-prospect/db";
import { readPageIdFromIntegrationConfig } from "./meta-lead-page-id";

/** Otra integración activa con el mismo pageId impide el enrutado determinista del webhook. */
export async function findActiveMetaLeadAdsPageConflict(
  prisma: PrismaClient,
  pageId: string,
  excludeIntegrationId?: string,
): Promise<{ id: string; accountId: string } | null> {
  const rows = await prisma.integration.findMany({
    where: { type: "meta_lead_ads", status: "active" },
    select: { id: true, accountId: true, config: true },
  });
  for (const r of rows) {
    if (excludeIntegrationId && r.id === excludeIntegrationId) continue;
    const pid = readPageIdFromIntegrationConfig(r.config);
    if (pid === pageId) {
      return { id: r.id, accountId: r.accountId };
    }
  }
  return null;
}
