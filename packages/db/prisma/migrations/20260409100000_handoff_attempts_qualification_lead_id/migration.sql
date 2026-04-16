-- LeadQualification.leadId + HandoffOutboundAttempt

ALTER TABLE "LeadQualification" ADD COLUMN "leadId" TEXT;

CREATE INDEX "LeadQualification_leadId_idx" ON "LeadQualification"("leadId");

ALTER TABLE "LeadQualification" ADD CONSTRAINT "LeadQualification_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "HandoffOutboundAttempt" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "targetUrl" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "ok" BOOLEAN NOT NULL DEFAULT false,
    "latencyMs" INTEGER,
    "requestBodySha256" TEXT,
    "responseSnippet" VARCHAR(4000),
    "errorMessage" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HandoffOutboundAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HandoffOutboundAttempt_accountId_createdAt_idx" ON "HandoffOutboundAttempt"("accountId", "createdAt" DESC);

CREATE INDEX "HandoffOutboundAttempt_leadId_createdAt_idx" ON "HandoffOutboundAttempt"("leadId", "createdAt" DESC);

ALTER TABLE "HandoffOutboundAttempt" ADD CONSTRAINT "HandoffOutboundAttempt_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
