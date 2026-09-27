/*
  Warnings:

  - Made the column `ratingFireCount` on table `ipos` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "gmp_histories_ipoId_idx";

-- DropIndex
DROP INDEX "subscription_histories_ipoId_idx";

-- AlterTable
ALTER TABLE "gmp_histories" ALTER COLUMN "expectedListingGain" SET DATA TYPE DECIMAL(8,2);

-- Backfill NULL ratingFireCount values before making the column NOT NULL
UPDATE "ipos" SET "ratingFireCount" = 0 WHERE "ratingFireCount" IS NULL;

-- AlterTable
ALTER TABLE "ipos" ADD COLUMN     "isLiveGmp" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "status" SET DEFAULT 'UPCOMING',
ALTER COLUMN "priceMin" DROP NOT NULL,
ALTER COLUMN "priceMax" DROP NOT NULL,
ALTER COLUMN "lotSize" DROP NOT NULL,
ALTER COLUMN "issueSizeCr" DROP NOT NULL,
ALTER COLUMN "issueSizeCr" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "openDate" DROP NOT NULL,
ALTER COLUMN "closeDate" DROP NOT NULL,
ALTER COLUMN "faceValue" DROP NOT NULL,
ALTER COLUMN "minimumInvestment" DROP NOT NULL,
ALTER COLUMN "minimumInvestment" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "ratingFireCount" SET NOT NULL,
ALTER COLUMN "ratingFireCount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "listing_performances" ALTER COLUMN "listingPrice" DROP NOT NULL,
ALTER COLUMN "listingGainPercent" DROP NOT NULL,
ALTER COLUMN "listingGainPercent" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "currentPrice" DROP NOT NULL,
ALTER COLUMN "currentGainPercent" DROP NOT NULL,
ALTER COLUMN "currentGainPercent" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "allTimeHigh" DROP NOT NULL,
ALTER COLUMN "allTimeLow" DROP NOT NULL;

-- AlterTable
ALTER TABLE "subscription_histories" ALTER COLUMN "retail" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "qib" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "nii" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "employee" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "shareholder" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "anchor" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "sync_logs" ALTER COLUMN "recordsRead" SET DEFAULT 0,
ALTER COLUMN "recordsCreated" SET DEFAULT 0,
ALTER COLUMN "recordsUpdated" SET DEFAULT 0,
ALTER COLUMN "recordsDeleted" SET DEFAULT 0,
ALTER COLUMN "durationMs" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "gmp_histories_ipoId_recordedAt_idx" ON "gmp_histories"("ipoId", "recordedAt");

-- CreateIndex
CREATE INDEX "listing_performances_lastUpdated_idx" ON "listing_performances"("lastUpdated");

-- CreateIndex
CREATE INDEX "subscription_histories_ipoId_recordedAt_idx" ON "subscription_histories"("ipoId", "recordedAt");

-- CreateIndex
CREATE INDEX "sync_logs_sheetName_idx" ON "sync_logs"("sheetName");

-- CreateIndex
CREATE INDEX "sync_logs_startedAt_idx" ON "sync_logs"("startedAt");
