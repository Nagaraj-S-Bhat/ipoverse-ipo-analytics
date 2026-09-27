-- AlterTable
ALTER TABLE "gmp_histories" ALTER COLUMN "kostak" DROP NOT NULL,
ALTER COLUMN "subjectToSauda" DROP NOT NULL,
ALTER COLUMN "expectedListingGain" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ipos" ADD COLUMN     "currentGmpPercent" DECIMAL(8,2),
ADD COLUMN     "sheetRowOrder" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "subscription_histories" ALTER COLUMN "retail" DROP NOT NULL,
ALTER COLUMN "qib" DROP NOT NULL,
ALTER COLUMN "nii" DROP NOT NULL,
ALTER COLUMN "employee" DROP NOT NULL,
ALTER COLUMN "shareholder" DROP NOT NULL,
ALTER COLUMN "anchor" DROP NOT NULL;
