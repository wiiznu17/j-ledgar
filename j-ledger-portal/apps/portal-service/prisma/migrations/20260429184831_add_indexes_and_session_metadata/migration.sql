-- AlterTable
ALTER TABLE "identity"."refresh_sessions" ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_adminUserId_idx" ON "audit"."audit_logs"("adminUserId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "otp_challenges_phoneNumber_idx" ON "identity"."otp_challenges"("phoneNumber");

-- CreateIndex
CREATE INDEX "otp_challenges_expiresAt_idx" ON "identity"."otp_challenges"("expiresAt");

-- CreateIndex
CREATE INDEX "otp_challenges_createdAt_idx" ON "identity"."otp_challenges"("createdAt");

-- CreateIndex
CREATE INDEX "refresh_sessions_userId_idx" ON "identity"."refresh_sessions"("userId");

-- CreateIndex
CREATE INDEX "refresh_sessions_expiresAt_idx" ON "identity"."refresh_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "refresh_sessions_revokedAt_idx" ON "identity"."refresh_sessions"("revokedAt");

-- CreateIndex
CREATE INDEX "users_phoneNumber_idx" ON "identity"."users"("phoneNumber");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "identity"."users"("status");

-- CreateIndex
CREATE INDEX "users_registrationState_idx" ON "identity"."users"("registrationState");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "identity"."users"("createdAt");

-- CreateIndex
CREATE INDEX "kyc_data_userId_idx" ON "kyc"."kyc_data"("userId");

-- CreateIndex
CREATE INDEX "kyc_data_verificationStatus_idx" ON "kyc"."kyc_data"("verificationStatus");

-- CreateIndex
CREATE INDEX "kyc_documents_userId_idx" ON "kyc"."kyc_documents"("userId");

-- CreateIndex
CREATE INDEX "kyc_documents_status_idx" ON "kyc"."kyc_documents"("status");

-- CreateIndex
CREATE INDEX "kyc_documents_documentType_idx" ON "kyc"."kyc_documents"("documentType");
