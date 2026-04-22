-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'LOCKED', 'FROZEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "RegistrationState" AS ENUM ('PENDING_OTP', 'OTP_VERIFIED', 'TC_ACCEPTED', 'ID_CARD_UPLOADED', 'KYC_VERIFIED', 'PROFILE_COMPLETED', 'PASSWORD_SET', 'CREDENTIALS_SET', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DeviceTrustLevel" AS ENUM ('TRUSTED', 'UNTRUSTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('TERMS_AND_CONDITIONS', 'PRIVACY_POLICY', 'MARKETING_COMMUNICATIONS', 'DATA_PROCESSING', 'BIOMETRIC_DATA_PROCESSING');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('ACTIVE', 'WITHDRAWN', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "KycReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "SuspiciousActivityType" AS ENUM ('LARGE_TRANSACTION', 'HIGH_FREQUENCY', 'ROUND_NUMBER', 'RAPID_MOVEMENT', 'HIGH_RISK_JURISDICTION', 'MULTIPLE_RECIPIENTS', 'STRUCTURING', 'UNUSUAL_PATTERN');

-- CreateEnum
CREATE TYPE "SuspiciousActivityStatus" AS ENUM ('FLAGGED', 'UNDER_REVIEW', 'CONFIRMED_SUSPICIOUS', 'CONFIRMED_LEGITIMATE', 'REPORTED_TO_AMLO');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'ROTATED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTRATION', 'DEVICE_TRUST');

-- CreateEnum
CREATE TYPE "OtpStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'LOCKED');

-- CreateEnum
CREATE TYPE "KycVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalType" AS ENUM ('P2P_TRANSFER', 'KYC_VERIFICATION', 'BALANCE_ADJUSTMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phoneNumber" VARCHAR(20),
    "email" VARCHAR(255),
    "passwordHash" VARCHAR(255),
    "pinHash" VARCHAR(255),
    "pinAttempts" INTEGER NOT NULL DEFAULT 0,
    "pinLockedUntil" TIMESTAMP(3),
    "loginFailCount" INTEGER NOT NULL DEFAULT 0,
    "loginLockedUntil" TIMESTAMP(3),
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "registrationState" "RegistrationState" NOT NULL DEFAULT 'PENDING_OTP',
    "ledgerAccountId" TEXT,
    "currentTrustedDeviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "occupation" TEXT,
    "incomeRange" TEXT,
    "sourceOfFunds" TEXT,
    "purposeOfAccount" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'ACTIVE',
    "consentVersion" VARCHAR(20) NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "reviewStatus" "KycReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "nextReviewDate" TIMESTAMP(3),
    "notes" TEXT,
    "pepScreened" BOOLEAN NOT NULL DEFAULT false,
    "pepStatus" TEXT,
    "sanctionsScreened" BOOLEAN NOT NULL DEFAULT false,
    "sanctionsStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspicious_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transferId" TEXT,
    "activityType" "SuspiciousActivityType" NOT NULL,
    "status" "SuspiciousActivityStatus" NOT NULL DEFAULT 'FLAGGED',
    "amount" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 50,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reportedToAmloAt" TIMESTAMP(3),
    "amloReference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suspicious_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceIdentifier" VARCHAR(128) NOT NULL,
    "deviceName" TEXT,
    "platform" VARCHAR(32),
    "appVersion" VARCHAR(32),
    "trustLevel" "DeviceTrustLevel" NOT NULL DEFAULT 'UNTRUSTED',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "jti" VARCHAR(64) NOT NULL,
    "refreshTokenHash" VARCHAR(255) NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedByJti" VARCHAR(64),
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "phoneNumber" VARCHAR(20) NOT NULL,
    "otpHash" VARCHAR(255) NOT NULL,
    "status" "OtpStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_data" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationStatus" "KycVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "idCardName" TEXT,
    "thaiNameEncrypted" TEXT,
    "prefix" VARCHAR(32),
    "idCardNumberEncrypted" TEXT,
    "idCardToken" VARCHAR(128),
    "idCardImageUrl" TEXT,
    "selfieImageUrl" TEXT,
    "idCardImageSha256" CHAR(64),
    "selfieImageSha256" CHAR(64),
    "faceMatchScore" DOUBLE PRECISION,
    "ocrConfidence" DOUBLE PRECISION,
    "livenessSessionId" VARCHAR(255),
    "idCardIssueDate" TIMESTAMP(3),
    "idCardExpiryDate" TIMESTAMP(3),
    "religion" VARCHAR(64),
    "reviewNote" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "providerReference" VARCHAR(255),
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" VARCHAR(64) NOT NULL,
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "deviceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_outbox" (
    "id" TEXT NOT NULL,
    "aggregateId" VARCHAR(64) NOT NULL,
    "eventType" VARCHAR(64) NOT NULL,
    "dedupeKey" VARCHAR(128) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ledger_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revoked_access_tokens" (
    "id" TEXT NOT NULL,
    "jti" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revoked_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "merchant_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantAccountId" VARCHAR(64) NOT NULL,
    "storeName" VARCHAR(255) NOT NULL,
    "qrCodeData" VARCHAR(512) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pin_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pin_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL,
    "idempotencyKey" VARCHAR(128) NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'THB',
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "approvalId" TEXT,
    "ledgerTxnId" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "approvalType" "ApprovalType" NOT NULL,
    "makerId" TEXT NOT NULL,
    "checkerId" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "data" JSONB NOT NULL,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "errorCode" VARCHAR(64) NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_codes" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "internalMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_messages" (
    "id" TEXT NOT NULL,
    "errorCodeId" TEXT NOT NULL,
    "language" VARCHAR(5) NOT NULL,
    "userMessage" TEXT NOT NULL,
    "recoveryAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_ledgerAccountId_key" ON "users"("ledgerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_consents_userId_idx" ON "user_consents"("userId");

-- CreateIndex
CREATE INDEX "user_consents_consentType_idx" ON "user_consents"("consentType");

-- CreateIndex
CREATE INDEX "user_consents_status_idx" ON "user_consents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_userId_consentType_consentVersion_key" ON "user_consents"("userId", "consentType", "consentVersion");

-- CreateIndex
CREATE INDEX "kyc_reviews_userId_idx" ON "kyc_reviews"("userId");

-- CreateIndex
CREATE INDEX "kyc_reviews_reviewStatus_idx" ON "kyc_reviews"("reviewStatus");

-- CreateIndex
CREATE INDEX "kyc_reviews_nextReviewDate_idx" ON "kyc_reviews"("nextReviewDate");

-- CreateIndex
CREATE INDEX "suspicious_activities_userId_idx" ON "suspicious_activities"("userId");

-- CreateIndex
CREATE INDEX "suspicious_activities_transferId_idx" ON "suspicious_activities"("transferId");

-- CreateIndex
CREATE INDEX "suspicious_activities_status_idx" ON "suspicious_activities"("status");

-- CreateIndex
CREATE INDEX "suspicious_activities_createdAt_idx" ON "suspicious_activities"("createdAt");

-- CreateIndex
CREATE INDEX "user_devices_deviceIdentifier_idx" ON "user_devices"("deviceIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_userId_deviceIdentifier_key" ON "user_devices"("userId", "deviceIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_sessions_jti_key" ON "refresh_sessions"("jti");

-- CreateIndex
CREATE INDEX "refresh_sessions_userId_status_idx" ON "refresh_sessions"("userId", "status");

-- CreateIndex
CREATE INDEX "refresh_sessions_deviceId_status_idx" ON "refresh_sessions"("deviceId", "status");

-- CreateIndex
CREATE INDEX "otp_challenges_userId_purpose_status_idx" ON "otp_challenges"("userId", "purpose", "status");

-- CreateIndex
CREATE INDEX "otp_challenges_phoneNumber_purpose_status_idx" ON "otp_challenges"("phoneNumber", "purpose", "status");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_data_userId_key" ON "kyc_data"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_data_idCardToken_key" ON "kyc_data"("idCardToken");

-- CreateIndex
CREATE INDEX "security_logs_userId_eventType_createdAt_idx" ON "security_logs"("userId", "eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_outbox_dedupeKey_key" ON "ledger_outbox"("dedupeKey");

-- CreateIndex
CREATE INDEX "ledger_outbox_status_nextRetryAt_idx" ON "ledger_outbox"("status", "nextRetryAt");

-- CreateIndex
CREATE UNIQUE INDEX "revoked_access_tokens_jti_key" ON "revoked_access_tokens"("jti");

-- CreateIndex
CREATE INDEX "revoked_access_tokens_expiresAt_idx" ON "revoked_access_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_profiles_userId_key" ON "merchant_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "merchant_profiles_qrCodeData_key" ON "merchant_profiles"("qrCodeData");

-- CreateIndex
CREATE INDEX "pin_attempts_userId_createdAt_idx" ON "pin_attempts"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "transfers_idempotencyKey_key" ON "transfers"("idempotencyKey");

-- CreateIndex
CREATE INDEX "transfers_fromUserId_createdAt_idx" ON "transfers"("fromUserId", "createdAt");

-- CreateIndex
CREATE INDEX "transfers_toUserId_createdAt_idx" ON "transfers"("toUserId", "createdAt");

-- CreateIndex
CREATE INDEX "transfers_status_idx" ON "transfers"("status");

-- CreateIndex
CREATE INDEX "approvals_userId_status_idx" ON "approvals"("userId", "status");

-- CreateIndex
CREATE INDEX "approvals_approvalType_status_idx" ON "approvals"("approvalType", "status");

-- CreateIndex
CREATE INDEX "approvals_checkerId_idx" ON "approvals"("checkerId");

-- CreateIndex
CREATE INDEX "error_logs_errorCode_createdAt_idx" ON "error_logs"("errorCode", "createdAt");

-- CreateIndex
CREATE INDEX "error_logs_userId_idx" ON "error_logs"("userId");

-- CreateIndex
CREATE INDEX "notification_history_userId_createdAt_idx" ON "notification_history"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "error_codes_code_key" ON "error_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "error_messages_errorCodeId_language_key" ON "error_messages"("errorCodeId", "language");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_reviews" ADD CONSTRAINT "kyc_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suspicious_activities" ADD CONSTRAINT "suspicious_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "user_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_data" ADD CONSTRAINT "kyc_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_profiles" ADD CONSTRAINT "merchant_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pin_attempts" ADD CONSTRAINT "pin_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "approvals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_history" ADD CONSTRAINT "notification_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_messages" ADD CONSTRAINT "error_messages_errorCodeId_fkey" FOREIGN KEY ("errorCodeId") REFERENCES "error_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
