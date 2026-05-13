/*
  Warnings:

  - You are about to drop the `merchants` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "merchant";

-- CreateEnum
CREATE TYPE "merchant"."PartnerStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "merchant"."TerminalStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "merchant"."ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "loyalty"."brands" ADD COLUMN     "partnerId" TEXT;

-- AlterTable
ALTER TABLE "loyalty"."deal_redemptions" ADD COLUMN     "usedAtMerchantId" TEXT;

-- DropTable
DROP TABLE "integration"."merchants";

-- CreateTable
CREATE TABLE "merchant"."partners" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "financeAccounts" JSONB,
    "isPaymentEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isLoyaltyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "merchant"."PartnerStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant"."merchants" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "location" JSONB,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant"."terminals" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "name" TEXT,
    "secretKey" TEXT NOT NULL,
    "hardwareId" TEXT,
    "status" "merchant"."TerminalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant"."merchant_applications" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "status" "merchant"."ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partners_taxId_key" ON "merchant"."partners"("taxId");

-- CreateIndex
CREATE INDEX "partners_userId_idx" ON "merchant"."partners"("userId");

-- CreateIndex
CREATE INDEX "partners_status_idx" ON "merchant"."partners"("status");

-- CreateIndex
CREATE INDEX "merchants_partnerId_idx" ON "merchant"."merchants"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "terminals_secretKey_key" ON "merchant"."terminals"("secretKey");

-- CreateIndex
CREATE UNIQUE INDEX "terminals_hardwareId_key" ON "merchant"."terminals"("hardwareId");

-- CreateIndex
CREATE INDEX "terminals_merchantId_idx" ON "merchant"."terminals"("merchantId");

-- CreateIndex
CREATE INDEX "merchant_applications_partnerId_idx" ON "merchant"."merchant_applications"("partnerId");

-- CreateIndex
CREATE INDEX "merchant_applications_userId_idx" ON "merchant"."merchant_applications"("userId");

-- CreateIndex
CREATE INDEX "merchant_applications_status_idx" ON "merchant"."merchant_applications"("status");

-- AddForeignKey
ALTER TABLE "merchant"."merchants" ADD CONSTRAINT "merchants_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "merchant"."partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant"."terminals" ADD CONSTRAINT "terminals_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchant"."merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant"."merchant_applications" ADD CONSTRAINT "merchant_applications_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "merchant"."partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
