/*
  Warnings:

  - A unique constraint covering the columns `[resetToken]` on the table `staffs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "identity"."UserStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "admin"."roles" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "admin"."staffs" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "kyc"."kyc_data" ADD COLUMN     "prefixEn" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "staffs_resetToken_key" ON "admin"."staffs"("resetToken");
