-- AlterTable
ALTER TABLE "Note" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Note" SET "updatedAt" = "createdAt";
