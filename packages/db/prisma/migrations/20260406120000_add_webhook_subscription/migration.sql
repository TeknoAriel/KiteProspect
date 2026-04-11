-- F3-E3 / L14: webhooks salientes por cuenta

CREATE TABLE "WebhookSubscription" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT,
    "url" TEXT NOT NULL,
    "signingSecret" TEXT NOT NULL,
    "events" JSONB NOT NULL DEFAULT '["lead.captured","contact.assignment_changed"]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebhookSubscription_accountId_idx" ON "WebhookSubscription"("accountId");

ALTER TABLE "WebhookSubscription" ADD CONSTRAINT "WebhookSubscription_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
