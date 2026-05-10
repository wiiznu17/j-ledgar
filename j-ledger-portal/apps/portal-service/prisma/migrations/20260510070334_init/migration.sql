-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "admin";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "audit";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "billing";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "integration";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "kyc";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "loyalty";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "reporting";

-- CreateEnum
CREATE TYPE "loyalty"."PointTransactionType" AS ENUM ('EARN', 'REDEEM', 'EXPIRE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "loyalty"."RedemptionStatus" AS ENUM ('REDEEMED', 'USED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "identity"."UserStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED', 'DELETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "identity"."RegistrationState" AS ENUM ('PENDING', 'PENDING_OTP', 'INITIATED', 'OTP_VERIFIED', 'TC_ACCEPTED', 'ID_CARD_UPLOADED', 'ID_CARD_CONFIRMED', 'KYC_VERIFIED', 'PROFILE_COMPLETED', 'PASSWORD_SET', 'CREDENTIALS_SET', 'COMPLETED');

-- CreateEnum
CREATE TYPE "identity"."AddressType" AS ENUM ('REGISTERED', 'CURRENT', 'WORK', 'SHIPPING', 'BILLING');

-- CreateEnum
CREATE TYPE "identity"."AddressVerificationSource" AS ENUM ('ID_CARD_OCR', 'MANUAL', 'UTILITY_BILL', 'BANK_STATEMENT');

-- CreateEnum
CREATE TYPE "identity"."DeviceTrustLevel" AS ENUM ('UNKNOWN', 'TRUSTED', 'UNTRUSTED');

-- CreateEnum
CREATE TYPE "identity"."ConsentType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'MARKETING_CONSENT', 'DATA_PROCESSING');

-- CreateEnum
CREATE TYPE "identity"."SecurityEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'LOGOUT_ALL', 'PIN_SETUP', 'PIN_CHANGE', 'PIN_LOCKED', 'BIOMETRIC_ENABLED', 'BIOMETRIC_DISABLED', 'DEVICE_REGISTERED', 'DEVICE_REMOVED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'PASSWORD_SET', 'PASSWORD_RESET', 'SUSPICIOUS_ACTIVITY', 'REGISTER_INIT_OTP', 'REGISTER_OTP_VERIFIED', 'REGISTRATION_COMPLETED', 'PIN_VERIFIED', 'PIN_FAILURE', 'KYC_SUBMITTED', 'KYC_APPROVED', 'KYC_REJECTED', 'PROFILE_UPDATED', 'ADDRESS_UPDATED', 'ACCOUNT_DELETION_REQUESTED', 'ACCOUNT_DELETED', 'CONSENT_WITHDRAWN');

-- CreateEnum
CREATE TYPE "kyc"."KYCDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "kyc"."KYCVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "integration"."TopupOrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "integration"."BankStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "integration"."MerchantStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "reporting"."ReportStatus" AS ENUM ('GENERATING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "billing"."InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "identity"."users" (
    "id" TEXT NOT NULL,
    "phoneNumber" VARCHAR(15) NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "pinHash" TEXT,
    "biometricKey" TEXT,
    "status" "identity"."UserStatus" NOT NULL DEFAULT 'INACTIVE',
    "registrationState" "identity"."RegistrationState" NOT NULL DEFAULT 'PENDING',
    "pinAttempts" INTEGER NOT NULL DEFAULT 0,
    "pinLockedUntil" TIMESTAMP(3),
    "ledgerAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "identity"."user_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceIdentifier" TEXT NOT NULL,
    "deviceName" TEXT,
    "deviceType" TEXT,
    "osVersion" TEXT,
    "appVersion" TEXT,
    "trustLevel" "identity"."DeviceTrustLevel" NOT NULL DEFAULT 'UNKNOWN',
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pushToken" TEXT,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."refresh_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceType" TEXT,
    "ipAddress" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "location" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "refresh_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."otp_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."user_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" "identity"."ConsentType" NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL,
    "withdrawnAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."security_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" "identity"."SecurityEventType" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idempotencyKey" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "path" TEXT,
    "referenceId" TEXT,
    "type" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."notification_preferences" (
    "userId" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "securityForceEmail" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "identity"."addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "identity"."AddressType" NOT NULL DEFAULT 'CURRENT',
    "label" TEXT,
    "line1" TEXT,
    "line2" TEXT,
    "subdistrict" TEXT,
    "district" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'TH',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationSource" "identity"."AddressVerificationSource",
    "documentRef" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc"."kyc_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Url" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "kyc"."KYCDocumentStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc"."kyc_data" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "idCardNumberEncrypted" TEXT,
    "idCardName" TEXT,
    "firstNameTh" TEXT,
    "lastNameTh" TEXT,
    "firstNameEn" TEXT,
    "lastNameEn" TEXT,
    "dateOfBirth" TIMESTAMP(3),
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
    "verificationStatus" "kyc"."KYCVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "prefixEn" TEXT,

    CONSTRAINT "kyc_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc"."pii" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "encryptedData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pii_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."staffs" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),

    CONSTRAINT "staffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."staff_roles" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration"."banks" (
    "id" BIGSERIAL NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "integration"."BankStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration"."merchants" (
    "id" BIGSERIAL NOT NULL,
    "merchantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "integration"."MerchantStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration"."topup_orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "status" "integration"."TopupOrderStatus" NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT,
    "clientSecretRef" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "financeTransactionId" TEXT,
    "processedEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topup_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit"."audit_logs" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestPayload" JSONB,
    "responseStatus" INTEGER,
    "changes" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting"."reports" (
    "id" BIGSERIAL NOT NULL,
    "reportType" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "fileUrl" TEXT,
    "generatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "reporting"."ReportStatus" NOT NULL DEFAULT 'GENERATING',

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "senderName" TEXT,
    "senderDetail" TEXT,
    "amount" DECIMAL(19,4) NOT NULL,
    "tax" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "total" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "status" "billing"."InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "referenceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(19,4) NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "identity"."users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "identity"."users"("email");

-- CreateIndex
CREATE INDEX "users_phoneNumber_idx" ON "identity"."users"("phoneNumber");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "identity"."users"("status");

-- CreateIndex
CREATE INDEX "users_registrationState_idx" ON "identity"."users"("registrationState");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "identity"."users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_points_userId_key" ON "loyalty"."user_points"("userId");

-- CreateIndex
CREATE INDEX "point_history_userId_idx" ON "loyalty"."point_history"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "loyalty"."brands"("name");

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

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_userId_deviceIdentifier_key" ON "identity"."user_devices"("userId", "deviceIdentifier");

-- CreateIndex
CREATE INDEX "refresh_sessions_userId_idx" ON "identity"."refresh_sessions"("userId");

-- CreateIndex
CREATE INDEX "refresh_sessions_expiresAt_idx" ON "identity"."refresh_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "refresh_sessions_revokedAt_idx" ON "identity"."refresh_sessions"("revokedAt");

-- CreateIndex
CREATE INDEX "otp_challenges_phoneNumber_idx" ON "identity"."otp_challenges"("phoneNumber");

-- CreateIndex
CREATE INDEX "otp_challenges_expiresAt_idx" ON "identity"."otp_challenges"("expiresAt");

-- CreateIndex
CREATE INDEX "otp_challenges_createdAt_idx" ON "identity"."otp_challenges"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_consents_userId_consentType_key" ON "identity"."user_consents"("userId", "consentType");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key_key" ON "identity"."user_settings"("userId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_idempotencyKey_key" ON "identity"."notifications"("idempotencyKey");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "identity"."notifications"("userId");

-- CreateIndex
CREATE INDEX "addresses_userId_idx" ON "identity"."addresses"("userId");

-- CreateIndex
CREATE INDEX "addresses_isVerified_idx" ON "identity"."addresses"("isVerified");

-- CreateIndex
CREATE INDEX "kyc_documents_userId_idx" ON "kyc"."kyc_documents"("userId");

-- CreateIndex
CREATE INDEX "kyc_documents_status_idx" ON "kyc"."kyc_documents"("status");

-- CreateIndex
CREATE INDEX "kyc_documents_documentType_idx" ON "kyc"."kyc_documents"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_data_userId_key" ON "kyc"."kyc_data"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_data_idCardToken_key" ON "kyc"."kyc_data"("idCardToken");

-- CreateIndex
CREATE INDEX "kyc_data_userId_idx" ON "kyc"."kyc_data"("userId");

-- CreateIndex
CREATE INDEX "kyc_data_verificationStatus_idx" ON "kyc"."kyc_data"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "pii_userId_field_key" ON "kyc"."pii"("userId", "field");

-- CreateIndex
CREATE UNIQUE INDEX "staffs_username_key" ON "admin"."staffs"("username");

-- CreateIndex
CREATE UNIQUE INDEX "staffs_email_key" ON "admin"."staffs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "staffs_resetToken_key" ON "admin"."staffs"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "admin"."roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "admin"."permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "staff_roles_staffId_roleId_key" ON "admin"."staff_roles"("staffId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "admin"."role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "merchants_merchantId_key" ON "integration"."merchants"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "topup_orders_stripePaymentIntentId_key" ON "integration"."topup_orders"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "topup_orders_idempotencyKey_key" ON "integration"."topup_orders"("idempotencyKey");

-- CreateIndex
CREATE INDEX "topup_orders_userId_status_idx" ON "integration"."topup_orders"("userId", "status");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_adminUserId_idx" ON "audit"."audit_logs"("adminUserId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit"."audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "billing"."invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_userId_idx" ON "billing"."invoices"("userId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "billing"."invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_createdAt_idx" ON "billing"."invoices"("createdAt");

-- AddForeignKey
ALTER TABLE "loyalty"."deals" ADD CONSTRAINT "deals_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "loyalty"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty"."deals" ADD CONSTRAINT "deals_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "loyalty"."deal_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty"."deal_redemptions" ADD CONSTRAINT "deal_redemptions_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "loyalty"."deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_devices" ADD CONSTRAINT "user_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."refresh_sessions" ADD CONSTRAINT "refresh_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."otp_challenges" ADD CONSTRAINT "otp_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_consents" ADD CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."security_events" ADD CONSTRAINT "security_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin"."staff_roles" ADD CONSTRAINT "staff_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "admin"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin"."staff_roles" ADD CONSTRAINT "staff_roles_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "admin"."staffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin"."role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "admin"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin"."role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "admin"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "billing"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
