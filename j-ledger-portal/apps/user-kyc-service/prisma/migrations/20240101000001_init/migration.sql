-- Init migration for user-kyc-service

CREATE SCHEMA IF NOT EXISTS user_kyc_schema;

-- User table
CREATE TABLE "user_kyc_schema"."users" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- KYCDocument table
CREATE TABLE "user_kyc_schema"."kyc_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Url" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- PII table
CREATE TABLE "user_kyc_schema"."pii" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pii_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "users_userId_key" ON "user_kyc_schema"."users"("userId");
CREATE UNIQUE INDEX "pii_userId_field_key" ON "user_kyc_schema"."pii"("userId", "field");

-- Foreign keys
ALTER TABLE "user_kyc_schema"."kyc_documents" ADD CONSTRAINT "kyc_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_kyc_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_kyc_schema"."pii" ADD CONSTRAINT "pii_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_kyc_schema"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
