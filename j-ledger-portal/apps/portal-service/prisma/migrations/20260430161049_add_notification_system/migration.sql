-- AlterTable
ALTER TABLE "identity"."user_devices" ADD COLUMN     "pushToken" TEXT;

-- CreateTable
CREATE TABLE "identity"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "identity"."notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "identity"."notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "identity"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
