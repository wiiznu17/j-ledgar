-- CreateEnum
CREATE TYPE "merchant"."PartnerType" AS ENUM ('SME', 'CORPORATE');

-- AlterTable
ALTER TABLE "merchant"."partners" ADD COLUMN     "type" "merchant"."PartnerType" NOT NULL DEFAULT 'SME';
