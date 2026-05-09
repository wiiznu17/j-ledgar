/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "billing"."invoices" DROP CONSTRAINT "invoices_userId_fkey";

-- DropForeignKey
ALTER TABLE "loyalty"."deal_redemptions" DROP CONSTRAINT "deal_redemptions_userId_fkey";

-- DropForeignKey
ALTER TABLE "loyalty"."point_history" DROP CONSTRAINT "point_history_userId_fkey";

-- DropForeignKey
ALTER TABLE "loyalty"."user_points" DROP CONSTRAINT "user_points_userId_fkey";

-- DropTable
DROP TABLE "kyc"."users";
