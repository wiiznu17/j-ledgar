-- CreateTable
CREATE TABLE "loyalty"."loyalty_rules" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "pointsPerThb" DOUBLE PRECISION NOT NULL DEFAULT 0.04,
    "minAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxPoints" INTEGER,
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "loyalty_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_rules_eventType_key" ON "loyalty"."loyalty_rules"("eventType");
