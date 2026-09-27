-- AlterTable
ALTER TABLE "ipos" ADD COLUMN     "isCurrentMainboard" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isCurrentSme" BOOLEAN NOT NULL DEFAULT false;
