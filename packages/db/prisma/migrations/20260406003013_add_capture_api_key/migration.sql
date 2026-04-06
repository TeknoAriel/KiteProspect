-- CreateTable
CREATE TABLE "CaptureApiKey" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "CaptureApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaptureApiKey_keyPrefix_key" ON "CaptureApiKey"("keyPrefix");

-- CreateIndex
CREATE INDEX "CaptureApiKey_accountId_idx" ON "CaptureApiKey"("accountId");

-- AddForeignKey
ALTER TABLE "CaptureApiKey" ADD CONSTRAINT "CaptureApiKey_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
