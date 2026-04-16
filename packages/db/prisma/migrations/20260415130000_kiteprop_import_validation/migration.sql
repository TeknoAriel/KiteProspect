-- CreateTable
CREATE TABLE "KitepropLeadSyncRun" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "lookbackDays" INTEGER NOT NULL DEFAULT 7,
    "fetchedCount" INTEGER NOT NULL DEFAULT 0,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "dedupedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" VARCHAR(2000),
    "rawPayloadSnapshot" JSONB,

    CONSTRAINT "KitepropLeadSyncRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitepropLeadSyncCursor" (
    "accountId" TEXT NOT NULL,
    "lastSuccessfulEndAt" TIMESTAMP(3),
    "opaqueCursor" VARCHAR(4000),

    CONSTRAINT "KitepropLeadSyncCursor_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "LeadReplyDraftReview" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL,
    "sourceChannel" TEXT,
    "sourcePortal" TEXT,
    "channelConfidence" DOUBLE PRECISION,
    "externalPropertyRef" JSONB,
    "propertyId" TEXT,
    "draftKind" TEXT,
    "draftPayload" JSONB,
    "editedPayload" JSONB,
    "manualReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "discardedAt" TIMESTAMP(3),
    "discardedReason" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadReplyDraftReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KitepropLeadSyncRun_accountId_startedAt_idx" ON "KitepropLeadSyncRun"("accountId", "startedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "LeadReplyDraftReview_leadId_key" ON "LeadReplyDraftReview"("leadId");

-- CreateIndex
CREATE INDEX "LeadReplyDraftReview_accountId_reviewStatus_idx" ON "LeadReplyDraftReview"("accountId", "reviewStatus");

-- CreateIndex
CREATE INDEX "LeadReplyDraftReview_contactId_idx" ON "LeadReplyDraftReview"("contactId");

-- AddForeignKey
ALTER TABLE "KitepropLeadSyncRun" ADD CONSTRAINT "KitepropLeadSyncRun_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitepropLeadSyncCursor" ADD CONSTRAINT "KitepropLeadSyncCursor_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadReplyDraftReview" ADD CONSTRAINT "LeadReplyDraftReview_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadReplyDraftReview" ADD CONSTRAINT "LeadReplyDraftReview_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadReplyDraftReview" ADD CONSTRAINT "LeadReplyDraftReview_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadReplyDraftReview" ADD CONSTRAINT "LeadReplyDraftReview_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
