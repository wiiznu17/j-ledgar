-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "loyalty";

-- CreateEnum
CREATE TYPE "loyalty"."PointTransactionType" AS ENUM ('EARN', 'REDEEM', 'EXPIRE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "loyalty"."RedemptionStatus" AS ENUM ('REDEEMED', 'USED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "loyalty"."user_points" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty"."point_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "loyalty"."PointTransactionType" NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty"."brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty"."deal_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "deal_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty"."deals" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "termsCondition" TEXT,
    "pointsRequired" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "remainingStock" INTEGER NOT NULL DEFAULT 0,
    "limitPerUser" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "actionPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty"."deal_redemptions" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "redemptionCode" TEXT NOT NULL,
    "status" "loyalty"."RedemptionStatus" NOT NULL DEFAULT 'REDEEMED',
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty"."banners" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "actionPath" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_points_userId_key" ON "loyalty"."user_points"("userId");

-- CreateIndex
CREATE INDEX "point_history_userId_idx" ON "loyalty"."point_history"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "deal_categories_name_key" ON "loyalty"."deal_categories"("name");

-- CreateIndex
CREATE INDEX "deals_brandId_idx" ON "loyalty"."deals"("brandId");

-- CreateIndex
CREATE INDEX "deals_categoryId_idx" ON "loyalty"."deals"("categoryId");

-- CreateIndex
CREATE INDEX "deals_isActive_idx" ON "loyalty"."deals"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "deal_redemptions_redemptionCode_key" ON "loyalty"."deal_redemptions"("redemptionCode");

-- CreateIndex
CREATE INDEX "deal_redemptions_dealId_idx" ON "loyalty"."deal_redemptions"("dealId");

-- CreateIndex
CREATE INDEX "deal_redemptions_userId_idx" ON "loyalty"."deal_redemptions"("userId");

-- AddForeignKey
ALTER TABLE "loyalty"."user_points" ADD CONSTRAINT "user_points_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty"."point_history" ADD CONSTRAINT "point_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty"."deals" ADD CONSTRAINT "deals_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "loyalty"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty"."deals" ADD CONSTRAINT "deals_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "loyalty"."deal_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty"."deal_redemptions" ADD CONSTRAINT "deal_redemptions_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "loyalty"."deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty"."deal_redemptions" ADD CONSTRAINT "deal_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
