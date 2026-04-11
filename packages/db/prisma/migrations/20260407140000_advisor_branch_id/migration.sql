-- AlterTable
ALTER TABLE "Advisor" ADD COLUMN "branchId" TEXT;

-- CreateIndex
CREATE INDEX "Advisor_accountId_branchId_idx" ON "Advisor"("accountId", "branchId");

-- AddForeignKey
ALTER TABLE "Advisor" ADD CONSTRAINT "Advisor_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
