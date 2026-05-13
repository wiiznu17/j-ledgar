-- AlterTable
ALTER TABLE "merchant"."merchant_applications" ADD COLUMN     "addressDetail" TEXT,
ADD COLUMN     "businessNameEn" TEXT,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
