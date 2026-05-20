/*
  Warnings:

  - Added the required column `address` to the `merchant_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `merchant_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactName` to the `merchant_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `merchant_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `merchant_applications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "merchant"."merchant_applications" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "contactName" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "location" JSONB,
ADD COLUMN     "phone" TEXT NOT NULL;
