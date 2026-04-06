-- AlterTable
ALTER TABLE "FollowUpSequence" ADD COLUMN     "matrixBranchLocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Note" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "property_account_external_key" RENAME TO "Property_accountId_externalSource_externalId_key";
