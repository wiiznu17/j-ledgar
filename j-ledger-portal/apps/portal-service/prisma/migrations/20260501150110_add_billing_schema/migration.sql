/*
  Warnings:

  - You are about to drop the column `body` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `notifications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `idempotencyKey` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "billing";

-- CreateEnum
CREATE TYPE "billing"."InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- DropIndex
DROP INDEX "identity"."notifications_createdAt_idx";

-- AlterTable
ALTER TABLE "identity"."notifications" DROP COLUMN "body",
DROP COLUMN "data",
ADD COLUMN     "idempotencyKey" TEXT NOT NULL,
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "path" TEXT,
ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "category" DROP NOT NULL;

-- CreateTable
CREATE TABLE "billing"."invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "senderName" TEXT,
    "senderDetail" TEXT,
    "amount" DECIMAL(19,4) NOT NULL,
    "tax" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "status" "billing"."InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "referenceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(19,4) NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "billing"."invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_userId_idx" ON "billing"."invoices"("userId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "billing"."invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_createdAt_idx" ON "billing"."invoices"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_idempotencyKey_key" ON "identity"."notifications"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "billing"."invoices" ADD CONSTRAINT "invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "billing"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
