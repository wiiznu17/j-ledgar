-- CreateTable
CREATE TABLE "user_kyc_schema"."users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_kyc_schema"."kyc_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Url" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_kyc_schema"."kyc_data" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "idCardNumberEncrypted" TEXT,
    "idCardName" TEXT,
    "thaiNameEncrypted" TEXT,
    "prefix" TEXT,
    "idCardToken" TEXT,
    "idCardImageUrl" TEXT,
    "idCardImageSha256" TEXT,
    "selfieImageUrl" TEXT,
    "selfieImageSha256" TEXT,
    "livenessSessionId" TEXT,
    "faceMatchScore" INTEGER,
    "idCardIssueDate" TIMESTAMP(3),
    "idCardExpiryDate" TIMESTAMP(3),
    "religion" TEXT,
    "reviewNote" TEXT,
    "ocrConfidence" DOUBLE PRECISION,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_kyc_schema"."pii" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pii_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_userId_key" ON "user_kyc_schema"."users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_data_userId_key" ON "user_kyc_schema"."kyc_data"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_data_idCardToken_key" ON "user_kyc_schema"."kyc_data"("idCardToken");

-- CreateIndex
CREATE UNIQUE INDEX "pii_userId_field_key" ON "user_kyc_schema"."pii"("userId", "field");

-- AddForeignKey
ALTER TABLE "user_kyc_schema"."kyc_documents" ADD CONSTRAINT "kyc_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_kyc_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_kyc_schema"."pii" ADD CONSTRAINT "pii_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_kyc_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
