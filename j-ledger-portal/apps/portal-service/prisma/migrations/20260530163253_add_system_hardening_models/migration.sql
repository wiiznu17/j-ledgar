-- CreateEnum
CREATE TYPE "admin"."ApprovalRequestType" AS ENUM ('LIMIT_UPDATE', 'PARTNER_APPROVAL', 'FEE_UPDATE', 'BLACKLIST_ADD', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "admin"."ApprovalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "admin"."BlacklistType" AS ENUM ('PHONE', 'IP', 'DEVICE', 'ACCOUNT');

-- CreateEnum
CREATE TYPE "admin"."FraudRuleType" AS ENUM ('VELOCITY', 'AMOUNT', 'LOCATION', 'NEW_DEVICE');

-- CreateEnum
CREATE TYPE "admin"."DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'WON', 'LOST', 'CLOSED');

-- CreateEnum
CREATE TYPE "integration"."ScheduledTransferStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "integration"."ScheduledTransferFrequency" AS ENUM ('ONCE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "identity"."favorite_recipients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientPhone" VARCHAR(15) NOT NULL,
    "recipientName" VARCHAR(100),
    "nickname" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorite_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."approval_requests" (
    "id" TEXT NOT NULL,
    "requestType" "admin"."ApprovalRequestType" NOT NULL,
    "requestData" JSONB NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "status" "admin"."ApprovalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."blacklists" (
    "id" TEXT NOT NULL,
    "type" "admin"."BlacklistType" NOT NULL,
    "value" TEXT NOT NULL,
    "reason" TEXT,
    "addedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blacklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."fraud_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" "admin"."FraudRuleType" NOT NULL,
    "condition" JSONB NOT NULL,
    "action" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."disputes" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT,
    "reason" TEXT NOT NULL,
    "status" "admin"."DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration"."scheduled_transfers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipientPhone" VARCHAR(15) NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "frequency" "integration"."ScheduledTransferFrequency" NOT NULL,
    "nextExecutionAt" TIMESTAMP(3) NOT NULL,
    "status" "integration"."ScheduledTransferStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorite_recipients_userId_recipientPhone_key" ON "identity"."favorite_recipients"("userId", "recipientPhone");

-- CreateIndex
CREATE INDEX "approval_requests_status_idx" ON "admin"."approval_requests"("status");

-- CreateIndex
CREATE INDEX "approval_requests_requestedBy_idx" ON "admin"."approval_requests"("requestedBy");

-- CreateIndex
CREATE INDEX "blacklists_isActive_idx" ON "admin"."blacklists"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "blacklists_type_value_key" ON "admin"."blacklists"("type", "value");

-- CreateIndex
CREATE UNIQUE INDEX "fraud_rules_name_key" ON "admin"."fraud_rules"("name");

-- CreateIndex
CREATE INDEX "disputes_userId_idx" ON "admin"."disputes"("userId");

-- CreateIndex
CREATE INDEX "disputes_transactionId_idx" ON "admin"."disputes"("transactionId");

-- CreateIndex
CREATE INDEX "scheduled_transfers_userId_idx" ON "integration"."scheduled_transfers"("userId");

-- CreateIndex
CREATE INDEX "scheduled_transfers_nextExecutionAt_idx" ON "integration"."scheduled_transfers"("nextExecutionAt");

-- CreateIndex
CREATE INDEX "scheduled_transfers_status_idx" ON "integration"."scheduled_transfers"("status");

-- AddForeignKey
ALTER TABLE "identity"."favorite_recipients" ADD CONSTRAINT "favorite_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
