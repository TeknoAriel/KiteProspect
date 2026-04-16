/**
 * Informe agregado: ingesta de propiedades (feed) y de leads/contactos (cualquier canal) en una ventana UTC.
 * Uso: dotenv -e .env -- npx tsx apps/web/scripts/ingestion-window-report.ts
 * Opcional: REPORT_DAYS=10 (default 10)
 *
 * Solo conteos y agrupaciones; no imprime emails ni teléfonos.
 */
import { prisma } from "@kite-prospect/db";

const DAYS = Math.min(90, Math.max(1, Number.parseInt(process.env.REPORT_DAYS ?? "10", 10) || 10));

async function main() {
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);

  const [
    propCreated,
    propFeedSeen,
    propAvailableTotal,
    contactTotal,
    syncRunsAgg,
    kitepropLeadsTotal,
    kitepropLeadDraftsTotal,
    kitepropLeadDraftsResolvedProperty,
    kitepropLeadDraftsUnresolvedProperty,
    kitepropLeadDistinctPropertyRefs,
    leadsBySource,
    convByChannel,
    idemBySource,
    accountsTouch,
    recentSyncRuns,
  ] = await Promise.all([
    prisma.property.groupBy({
      by: ["externalSource"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.property.groupBy({
      by: ["externalSource"],
      where: { feedLastSeenAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.property.count({
      where: { externalSource: "kiteprop", status: "available" },
    }),
    prisma.contact.count({ where: { createdAt: { gte: since } } }),
    prisma.kitepropLeadSyncRun.aggregate({
      where: { startedAt: { gte: since } },
      _count: { _all: true },
      _sum: {
        fetchedCount: true,
        importedCount: true,
        dedupedCount: true,
        skippedCount: true,
        errorCount: true,
      },
    }),
    prisma.lead.count({
      where: {
        createdAt: { gte: since },
        source: "kiteprop_api",
      },
    }),
    prisma.leadReplyDraftReview.count({
      where: {
        createdAt: { gte: since },
        lead: { source: "kiteprop_api" },
      },
    }),
    prisma.leadReplyDraftReview.count({
      where: {
        createdAt: { gte: since },
        lead: { source: "kiteprop_api" },
        propertyId: { not: null },
      },
    }),
    prisma.leadReplyDraftReview.count({
      where: {
        createdAt: { gte: since },
        lead: { source: "kiteprop_api" },
        propertyId: null,
      },
    }),
    prisma.leadReplyDraftReview.findMany({
      where: {
        createdAt: { gte: since },
        lead: { source: "kiteprop_api" },
        propertyId: { not: null },
      },
      select: { propertyId: true },
      distinct: ["propertyId"],
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.conversation.groupBy({
      by: ["channel"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.ingestionIdempotencyKey.groupBy({
      by: ["source"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.contact.groupBy({
      by: ["accountId"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.kitepropLeadSyncRun.findMany({
      where: { startedAt: { gte: since } },
      orderBy: { startedAt: "desc" },
      take: 12,
      select: {
        id: true,
        accountId: true,
        startedAt: true,
        completedAt: true,
        status: true,
        lookbackDays: true,
        fetchedCount: true,
        importedCount: true,
        skippedCount: true,
        dedupedCount: true,
        errorCount: true,
        errorMessage: true,
      },
    }),
  ]);

  const accountIds = [...new Set(accountsTouch.map((a) => a.accountId))];
  const syncAccountIds = [...new Set(recentSyncRuns.map((r) => r.accountId))];
  const allIds = [...new Set([...accountIds, ...syncAccountIds])];

  const accounts = await prisma.account.findMany({
    where: { id: { in: allIds } },
    select: { id: true, slug: true, name: true },
  });
  const slugMap = Object.fromEntries(accounts.map((a) => [a.id, a.slug]));

  const contactsByAccount = accountsTouch
    .map((r) => ({
      accountSlug: slugMap[r.accountId] ?? r.accountId,
      newContacts: r._count._all,
    }))
    .sort((a, b) => b.newContacts - a.newContacts);

  const syncRunsLabeled = recentSyncRuns.map((r) => ({
    ...r,
    accountSlug: slugMap[r.accountId] ?? r.accountId,
  }));

  const out = {
    report: "ingestion-window",
    daysUtc: DAYS,
    sinceUtc: since.toISOString(),
    generatedAtUtc: new Date().toISOString(),
    properties: {
      rowsCreatedInWindowByExternalSource: propCreated,
      rowsWithFeedActivityInWindowByExternalSource: propFeedSeen,
      availableKitepropPropertiesNow: propAvailableTotal,
    },
    contacts: {
      newContactsTotal: contactTotal,
      newContactsByAccountSlug: contactsByAccount,
    },
    leads: {
      newLeadsBySource: leadsBySource,
      kitepropApi: {
        leadsTotal: kitepropLeadsTotal,
        draftReviewsTotal: kitepropLeadDraftsTotal,
        draftsWithResolvedProperty: kitepropLeadDraftsResolvedProperty,
        draftsWithoutResolvedProperty: kitepropLeadDraftsUnresolvedProperty,
        distinctResolvedPropertyRefs: kitepropLeadDistinctPropertyRefs.length,
      },
    },
    conversations: {
      newConversationsByChannel: convByChannel,
    },
    deduplicationKeys: {
      ingestionIdempotencyKeysCreatedBySource: idemBySource,
    },
    kitepropRestImport: {
      runsInWindow: syncRunsAgg._count._all,
      sums: syncRunsAgg._sum,
      recentRuns: syncRunsLabeled,
    },
  };

  console.log(JSON.stringify(out, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
