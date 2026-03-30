-- KiteProp ingest: campos de portal + estado withdrawn + clave externa por cuenta

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "externalSource" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "externalId" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "importFingerprint" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "amenities" JSONB;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "province" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "country" TEXT DEFAULT 'AR';
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'ARS';
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "surfaceTotal" DECIMAL(12,2);
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "surfaceCovered" DECIMAL(12,2);
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "rooms" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(12,9);
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(12,9);
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "feedLastSeenAt" TIMESTAMP(3);
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "feedRemovedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "property_account_external_key"
  ON "Property" ("accountId", "externalSource", "externalId");

CREATE INDEX IF NOT EXISTS "Property_accountId_externalSource_idx"
  ON "Property" ("accountId", "externalSource");
