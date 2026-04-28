-- CreateEnum
CREATE TYPE "integration"."TopupOrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "integration"."topup_orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "status" "integration"."TopupOrderStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT,
    "clientSecretRef" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "financeTransactionId" TEXT,
    "processedEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topup_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "topup_orders_stripePaymentIntentId_key" ON "integration"."topup_orders"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "topup_orders_idempotencyKey_key" ON "integration"."topup_orders"("idempotencyKey");

-- CreateIndex
CREATE INDEX "topup_orders_userId_status_idx" ON "integration"."topup_orders"("userId", "status");
