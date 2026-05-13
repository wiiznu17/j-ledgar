-- CreateTable
CREATE TABLE "merchant"."terminal_idempotency_records" (
    "id" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responsePayload" JSONB NOT NULL,
    "status" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terminal_idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "terminal_idempotency_records_expiresAt_idx" ON "merchant"."terminal_idempotency_records"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "terminal_idempotency_records_terminalId_operation_idempoten_key" ON "merchant"."terminal_idempotency_records"("terminalId", "operation", "idempotencyKey");
