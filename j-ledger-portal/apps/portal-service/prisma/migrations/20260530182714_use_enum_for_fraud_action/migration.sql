/*
  Warnings:

  - Changed the type of `action` on the `fraud_rules` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "admin"."FraudRuleAction" AS ENUM ('BLOCK', 'FLAG', 'HOLD');

-- AlterTable
ALTER TABLE "admin"."fraud_rules" DROP COLUMN "action",
ADD COLUMN     "action" "admin"."FraudRuleAction" NOT NULL;
