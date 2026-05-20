-- AlterTable
ALTER TABLE "billing"."invoices" ADD COLUMN     "feeAmount" DECIMAL(19,4),
ADD COLUMN     "feeRate" DECIMAL(19,4),
ADD COLUMN     "feeTax" DECIMAL(19,4),
ADD COLUMN     "partnerId" TEXT;

-- AlterTable
ALTER TABLE "merchant"."partners" ADD COLUMN     "feeRate" DECIMAL(19,4) NOT NULL DEFAULT 0.03;

-- AddForeignKey
ALTER TABLE "billing"."invoices" ADD CONSTRAINT "invoices_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "merchant"."partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
