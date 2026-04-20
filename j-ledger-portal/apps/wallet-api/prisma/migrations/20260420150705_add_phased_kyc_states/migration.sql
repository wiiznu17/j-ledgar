-- AlterEnum
ALTER TYPE "RegistrationState" ADD VALUE 'ID_CARD_UPLOADED';

-- AlterTable
ALTER TABLE "kyc_data" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "idCardName" TEXT,
ADD COLUMN     "livenessSessionId" VARCHAR(255),
ADD COLUMN     "ocrConfidence" DOUBLE PRECISION,
ADD COLUMN     "reviewNote" TEXT;
