-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "IPOType" AS ENUM ('MAINBOARD', 'SME');

-- CreateEnum
CREATE TYPE "IPOStatus" AS ENUM ('UPCOMING', 'OPEN', 'CLOSED', 'LISTED', 'WITHDRAWN', 'POSTPONED');

-- CreateEnum
CREATE TYPE "Exchange" AS ENUM ('NSE', 'BSE', 'NSE_BSE');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "recordsRead" INTEGER NOT NULL,
    "recordsCreated" INTEGER NOT NULL,
    "recordsUpdated" INTEGER NOT NULL,
    "recordsDeleted" INTEGER NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipos" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "symbol" TEXT,
    "slug" TEXT NOT NULL,
    "type" "IPOType" NOT NULL,
    "status" "IPOStatus" NOT NULL,
    "priceMin" DECIMAL(12,2) NOT NULL,
    "priceMax" DECIMAL(12,2) NOT NULL,
    "issuePrice" DECIMAL(12,2),
    "lotSize" INTEGER NOT NULL,
    "issueSizeCr" DECIMAL(12,2) NOT NULL,
    "openDate" DATE NOT NULL,
    "closeDate" DATE NOT NULL,
    "allotmentDate" DATE,
    "refundDate" DATE,
    "creditDate" DATE,
    "listingDate" DATE,
    "companyLogo" TEXT,
    "companyBanner" TEXT,
    "companyDescription" TEXT,
    "website" TEXT,
    "sector" TEXT,
    "industry" TEXT,
    "exchange" "Exchange",
    "leadManager" TEXT,
    "registrarName" TEXT,
    "registrarUrl" TEXT,
    "prospectusUrl" TEXT,
    "drhpUrl" TEXT,
    "isin" TEXT,
    "faceValue" DECIMAL(12,2) NOT NULL,
    "minimumInvestment" DECIMAL(12,2) NOT NULL,
    "employeeReservation" DECIMAL(12,2),
    "shareholderReservation" DECIMAL(12,2),
    "marketMaker" TEXT,
    "listingAt" TEXT,
    "reviewSummary" TEXT,
    "searchKeywords" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalUrl" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_performances" (
    "id" TEXT NOT NULL,
    "ipoId" TEXT NOT NULL,
    "listingPrice" DECIMAL(12,2) NOT NULL,
    "listingGainPercent" DECIMAL(6,2) NOT NULL,
    "currentPrice" DECIMAL(12,2) NOT NULL,
    "currentGainPercent" DECIMAL(6,2) NOT NULL,
    "allTimeHigh" DECIMAL(12,2) NOT NULL,
    "allTimeLow" DECIMAL(12,2) NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_performances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gmp_histories" (
    "id" TEXT NOT NULL,
    "ipoId" TEXT NOT NULL,
    "gmp" DECIMAL(12,2) NOT NULL,
    "kostak" DECIMAL(12,2) NOT NULL,
    "subjectToSauda" DECIMAL(12,2) NOT NULL,
    "expectedListingGain" DECIMAL(6,2) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmp_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_histories" (
    "id" TEXT NOT NULL,
    "ipoId" TEXT NOT NULL,
    "retail" DECIMAL(10,2) NOT NULL,
    "qib" DECIMAL(10,2) NOT NULL,
    "nii" DECIMAL(10,2) NOT NULL,
    "employee" DECIMAL(10,2) NOT NULL,
    "shareholder" DECIMAL(10,2) NOT NULL,
    "anchor" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ipos_symbol_key" ON "ipos"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "ipos_slug_key" ON "ipos"("slug");

-- CreateIndex
CREATE INDEX "ipos_slug_idx" ON "ipos"("slug");

-- CreateIndex
CREATE INDEX "ipos_companyName_idx" ON "ipos"("companyName");

-- CreateIndex
CREATE INDEX "ipos_symbol_idx" ON "ipos"("symbol");

-- CreateIndex
CREATE INDEX "ipos_type_status_isDeleted_idx" ON "ipos"("type", "status", "isDeleted");

-- CreateIndex
CREATE INDEX "ipos_listingDate_idx" ON "ipos"("listingDate");

-- CreateIndex
CREATE INDEX "ipos_openDate_idx" ON "ipos"("openDate");

-- CreateIndex
CREATE INDEX "ipos_closeDate_idx" ON "ipos"("closeDate");

-- CreateIndex
CREATE UNIQUE INDEX "listing_performances_ipoId_key" ON "listing_performances"("ipoId");

-- CreateIndex
CREATE INDEX "gmp_histories_recordedAt_idx" ON "gmp_histories"("recordedAt");

-- CreateIndex
CREATE INDEX "gmp_histories_ipoId_idx" ON "gmp_histories"("ipoId");

-- CreateIndex
CREATE INDEX "subscription_histories_recordedAt_idx" ON "subscription_histories"("recordedAt");

-- CreateIndex
CREATE INDEX "subscription_histories_ipoId_idx" ON "subscription_histories"("ipoId");

-- AddForeignKey
ALTER TABLE "listing_performances" ADD CONSTRAINT "listing_performances_ipoId_fkey" FOREIGN KEY ("ipoId") REFERENCES "ipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gmp_histories" ADD CONSTRAINT "gmp_histories_ipoId_fkey" FOREIGN KEY ("ipoId") REFERENCES "ipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_histories" ADD CONSTRAINT "subscription_histories_ipoId_fkey" FOREIGN KEY ("ipoId") REFERENCES "ipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
