-- F3-E4 / L15: sucursales por tenant + Contact.branchId opcional

CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Branch_accountId_slug_key" ON "Branch"("accountId", "slug");
CREATE INDEX "Branch_accountId_idx" ON "Branch"("accountId");

ALTER TABLE "Branch" ADD CONSTRAINT "Branch_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Contact" ADD COLUMN "branchId" TEXT;
CREATE INDEX "Contact_branchId_idx" ON "Contact"("branchId");
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
