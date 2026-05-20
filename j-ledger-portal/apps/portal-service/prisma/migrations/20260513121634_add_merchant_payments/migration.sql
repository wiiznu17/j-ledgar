-- CreateEnum
CREATE TYPE "merchant"."MerchantPaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "merchant"."merchant_payments" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "terminalId" TEXT,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "status" "merchant"."MerchantPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "referenceId" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merchant_payments_idempotencyKey_key" ON "merchant"."merchant_payments"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_payments_referenceId_key" ON "merchant"."merchant_payments"("referenceId");

-- AddForeignKey
ALTER TABLE "merchant"."merchant_payments" ADD CONSTRAINT "merchant_payments_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "merchant"."merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant"."merchant_payments" ADD CONSTRAINT "merchant_payments_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "merchant"."terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
