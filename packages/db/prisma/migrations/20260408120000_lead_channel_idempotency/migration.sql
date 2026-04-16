-- Lead, ChannelState, IngestionIdempotencyKey; Conversation.leadId; LeadScore.leadId

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "leadId" TEXT;

-- AlterTable
ALTER TABLE "LeadScore" ADD COLUMN     "leadId" TEXT;

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "source" TEXT NOT NULL DEFAULT 'form',
    "campaignId" TEXT,
    "archivedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelState" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "lastInboundAt" TIMESTAMP(3),
    "lastOutboundAt" TIMESTAMP(3),
    "waSessionExpiresAt" TIMESTAMP(3),
    "lastEmailFollowUpAt" TIMESTAMP(3),
    "outboundCount24h" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionIdempotencyKey" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionIdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_accountId_contactId_idx" ON "Lead"("accountId", "contactId");

-- CreateIndex
CREATE INDEX "Lead_contactId_status_idx" ON "Lead"("contactId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelState_accountId_contactId_channel_key" ON "ChannelState"("accountId", "contactId", "channel");

-- CreateIndex
CREATE INDEX "ChannelState_accountId_idx" ON "ChannelState"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "IngestionIdempotencyKey_accountId_source_key_key" ON "IngestionIdempotencyKey"("accountId", "source", "key");

-- CreateIndex
CREATE INDEX "IngestionIdempotencyKey_accountId_idx" ON "IngestionIdempotencyKey"("accountId");

-- CreateIndex
CREATE INDEX "Conversation_leadId_idx" ON "Conversation"("leadId");

-- CreateIndex
CREATE INDEX "LeadScore_leadId_idx" ON "LeadScore"("leadId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelState" ADD CONSTRAINT "ChannelState_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelState" ADD CONSTRAINT "ChannelState_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionIdempotencyKey" ADD CONSTRAINT "IngestionIdempotencyKey_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadScore" ADD CONSTRAINT "LeadScore_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A lo sumo un lead open o qualified por contacto (Postgres partial unique)
CREATE UNIQUE INDEX "Lead_one_active_per_contact"
  ON "Lead" ("contactId")
  WHERE "status" IN ('open', 'qualified');
