-- AlterTable
ALTER TABLE "merchant"."partners" ADD COLUMN     "dailyReceiveLimit" DECIMAL(19,4) NOT NULL DEFAULT 1000000;
