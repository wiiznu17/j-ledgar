-- CreateEnum
CREATE TYPE "identity"."AddressType" AS ENUM ('REGISTERED', 'CURRENT', 'WORK', 'SHIPPING', 'BILLING');

-- CreateEnum
CREATE TYPE "identity"."AddressVerificationSource" AS ENUM ('ID_CARD_OCR', 'MANUAL', 'UTILITY_BILL', 'BANK_STATEMENT');

-- CreateEnum
CREATE TYPE "kyc"."KYCDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "kyc"."KYCVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "integration"."BankStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "integration"."MerchantStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "reporting"."ReportStatus" AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "integration"."banks" DROP COLUMN "status",
ADD COLUMN     "status" "integration"."BankStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "integration"."merchants" DROP COLUMN "status",
ADD COLUMN     "status" "integration"."MerchantStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "kyc"."kyc_data" DROP COLUMN "verificationStatus",
ADD COLUMN     "verificationStatus" "kyc"."KYCVerificationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "kyc"."kyc_documents" DROP COLUMN "status",
ADD COLUMN     "status" "kyc"."KYCDocumentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "reporting"."reports" DROP COLUMN "status",
ADD COLUMN     "status" "reporting"."ReportStatus" NOT NULL DEFAULT 'GENERATING';

-- CreateTable
CREATE TABLE "identity"."addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "identity"."AddressType" NOT NULL DEFAULT 'CURRENT',
    "label" TEXT,
    "line1" TEXT,
    "line2" TEXT,
    "subdistrict" TEXT,
    "district" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'TH',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationSource" "identity"."AddressVerificationSource",
    "documentRef" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "addresses_userId_idx" ON "identity"."addresses"("userId");

-- CreateIndex
CREATE INDEX "addresses_isVerified_idx" ON "identity"."addresses"("isVerified");

-- CreateIndex
CREATE INDEX "kyc_data_verificationStatus_idx" ON "kyc"."kyc_data"("verificationStatus");

-- CreateIndex
CREATE INDEX "kyc_documents_status_idx" ON "kyc"."kyc_documents"("status");


-- Custom SQL: Partial Unique Index for Address History
CREATE UNIQUE INDEX addresses_user_type_active ON "identity"."addresses"("userId", "type") WHERE "deletedAt" IS NULL;
