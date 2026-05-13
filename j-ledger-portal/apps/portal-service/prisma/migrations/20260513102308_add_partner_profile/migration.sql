-- CreateTable
CREATE TABLE "merchant"."partner_profiles" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "businessNameEn" TEXT,
    "category" TEXT,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "addressDetail" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_profiles_partnerId_key" ON "merchant"."partner_profiles"("partnerId");

-- AddForeignKey
ALTER TABLE "merchant"."partner_profiles" ADD CONSTRAINT "partner_profiles_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "merchant"."partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
