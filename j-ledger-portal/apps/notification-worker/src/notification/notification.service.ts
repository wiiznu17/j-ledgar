import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { PushService } from '../push/push.service';
import { NotificationEventType, KafkaTopic, NotificationCategory, AppPath } from '@repo/dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
  ) {}

  async handleEvent(topic: string, payload: any) {
    this.logger.debug(
      `[HandleEvent] topic=${topic} eventType=${payload.eventType || payload.status} userId=${payload.userId}`,
    );
    try {
      const { userId, eventType, referenceId, metadata, status } = payload;

      // Map legacy status if coming from KYC events
      const actualEventType = eventType || payload.status || 'NOTIFICATION';
      const actualReferenceId =
        referenceId || payload.documentId || payload.transactionId || Date.now().toString();

      const idempotencyKey = `${userId}:${actualEventType}:${actualReferenceId}`;

      // 1. Idempotency Check
      const existing = await this.prisma.notification.findUnique({
        where: { idempotencyKey },
      });

      // 2. Fetch User Context
      const [user, prefs, devices] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.notificationPreference.findUnique({ where: { userId } }),
        this.prisma.userDevice.findMany({
          where: { userId, pushToken: { not: null } },
        }),
      ]);

      if (!user) {
        this.logger.error(`User ${userId} not found for notification`);
        return;
      }

      const title = this.generateTitle(topic, actualEventType, metadata);
      const body = this.generateBody(topic, actualEventType, metadata);
      const { category, path } = this.getCategoryAndPath(actualEventType, metadata);

      if (!existing) {
        // 3. Persist to Inbox (Only if new)
        await this.prisma.notification.create({
          data: {
            userId,
            type: actualEventType,
            title,
            message: body,
            category,
            path,
            metadata: metadata || {},
            referenceId: actualReferenceId,
            idempotencyKey,
          },
        });
      } else {
        this.logger.debug(
          `Duplicate event, skipping DB record but proceeding to push: ${idempotencyKey}`,
        );
      }

      // 4. Routing Logic
      const isSecurityEvent = topic === KafkaTopic.SECURITY_EVENTS;
      let pushAttempted = false;
      let pushSuccess = false;

      // Push Strategy
      if (isSecurityEvent || prefs?.pushEnabled !== false) {
        if (devices.length > 0) {
          pushAttempted = true;
          for (const device of devices) {
            const ok = await this.pushService.sendPushNotification(device.pushToken!, title, body, {
              ...metadata,
              topic,
              eventType: actualEventType,
              url:
                (actualEventType === 'TRANSFER' || actualEventType === 'TOPUP') &&
                metadata?.transactionId
                  ? `/transaction/${metadata.transactionId}`
                  : undefined,
            });
            if (ok) pushSuccess = true;
          }
        }
      }

      // Email Strategy (Fallback or Forced)
      const shouldSendEmail =
        isSecurityEvent ||
        (pushAttempted && !pushSuccess && prefs?.emailEnabled !== false) ||
        (!pushAttempted && prefs?.emailEnabled !== false);

      if (shouldSendEmail && user.email) {
        await this.emailService.sendEmail(user.email, title, this.wrapEmailHtml(title, body));
      }

      this.logger.log(`Notification processed for user ${userId}: ${actualEventType}`);
    } catch (error) {
      this.logger.error(`Failed to handle notification event`, error);
    }
  }

  private generateTitle(topic: string, eventType: string, metadata: any): string {
    const type = eventType?.toUpperCase();

    if (topic === KafkaTopic.SECURITY_EVENTS) {
      if (type === NotificationEventType.LOGIN_FAILURE) return 'Security Alert: Failed Login';
      if (type === NotificationEventType.PASSWORD_CHANGE) return 'Security Alert: Password Updated';
      if (type === NotificationEventType.REGISTRATION_COMPLETED) return 'Welcome to J-Ledger!';
      return 'Security Alert';
    }

    if (topic === KafkaTopic.KYC_EVENTS || type === NotificationEventType.KYC_SUBMITTED) {
      return 'Identity Verification';
    }

    if (type === NotificationEventType.TOPUP) return 'Wallet Top-up';
    if (type === NotificationEventType.TRANSFER) {
      // Check if user is receiver based on metadata
      return metadata?.isReceiver ? 'Money Received' : 'Payment Sent';
    }

    return 'J-Ledger Notification';
  }

  private generateBody(topic: string, eventType: string, metadata: any): string {
    const amount = Number(metadata?.amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const rawRef = metadata?.transactionId || metadata?.referenceId || '';
    const ref = String(rawRef);
    const refText = ref && ref.length > 0 ? ` (Ref: ${ref.slice(-8).toUpperCase()})` : '';

    switch (eventType?.toUpperCase()) {
      case NotificationEventType.LOGIN_SUCCESS:
        return `Secure login detected from ${metadata?.deviceName || metadata?.ipAddress || 'a new device'}. If this wasn't you, please secure your account immediately.`;

      case NotificationEventType.LOGIN_FAILURE:
        return `A failed login attempt was detected for your account from ${metadata?.deviceName || 'an unknown device'}. If this wasn't you, we recommend monitoring your account.`;

      case NotificationEventType.PASSWORD_CHANGE:
        return `Your account password has been successfully updated. If you did not perform this change, please contact support immediately to secure your wallet.`;

      case NotificationEventType.KYC_SUBMITTED:
        return `We've received your identity documents! Our team is currently reviewing your application. This usually takes 1-3 business days.`;

      case NotificationEventType.REGISTRATION_COMPLETED:
        return `Welcome to the family! Your J-Ledger account is now fully active. You can now start managing your digital assets securely.`;

      case NotificationEventType.KYC_APPROVED:
        return 'Congratulations! Your identity verification has been successfully approved. You now have full access to all features.';

      case NotificationEventType.KYC_REJECTED:
        return `Identity verification was not successful. Reason: ${metadata?.reason || 'Document clarity issue'}. Please try again or contact support.`;

      case NotificationEventType.TOPUP:
        const source =
          metadata?.source || metadata?.description?.split('via ')?.[1] || 'Bank Transfer';
        return `Your wallet has been successfully topped up with ฿${amount} via ${source}.${refText}`;

      case NotificationEventType.TRANSFER:
        if (metadata?.isReceiver) {
          console.log(metadata);
          const sender = metadata?.senderName || metadata?.senderPhone || 'a J-Ledger user';
          return `You have received ฿${amount} from ${sender}.${refText}`;
        } else {
          const recipient = metadata?.recipientName || metadata?.recipientPhone || 'Recipient';
          return `Payment of ฿${amount} to ${recipient} has been processed successfully.${refText}`;
        }

      default:
        return `You have a new update regarding your account activities.`;
    }
  }

  private wrapEmailHtml(title: string, body: string): string {
    return `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #007bff;">${title}</h2>
        <p>${body}</p>
        <hr />
        <p style="font-size: 12px; color: #999;">This is an automated message from J-Ledger. Please do not reply.</p>
      </div>
    `;
  }

  private getCategoryAndPath(
    eventType: string,
    metadata: any,
  ): { category: string; path?: string } {
    const type = eventType?.toUpperCase();

    // Default Category Mapping
    if (
      [
        NotificationEventType.TRANSFER,
        NotificationEventType.TOPUP,
        NotificationEventType.WITHDRAW,
        'PAYMENT',
        'FINANCE',
      ].includes(type)
    ) {
      const transactionId = metadata?.transactionId || metadata?.referenceId;
      return {
        category: NotificationCategory.FINANCE,
        path: transactionId ? `${AppPath.TRANSACTION_DETAIL}/${transactionId}` : undefined,
      };
    }

    if (
      [
        'SECURITY',
        NotificationEventType.LOGIN_SUCCESS,
        NotificationEventType.PASSWORD_CHANGE,
      ].includes(type)
    ) {
      return { category: NotificationCategory.SYSTEM, path: AppPath.PROFILE_SECURITY };
    }

    if (
      [
        'KYC_STATUS',
        NotificationEventType.KYC_APPROVED,
        NotificationEventType.KYC_REJECTED,
        NotificationEventType.KYC_SUBMITTED,
      ].includes(type)
    ) {
      return { category: NotificationCategory.SYSTEM, path: AppPath.PROFILE_INFO };
    }

    if (type === NotificationEventType.REGISTRATION_COMPLETED) {
      return { category: NotificationCategory.SYSTEM, path: AppPath.HOME };
    }

    if (['PROMO', 'OFFER', 'CAMPAIGN'].includes(type)) {
      return { category: NotificationCategory.PROMO };
    }

    if (['NEWS', 'ANNOUNCEMENT'].includes(type)) {
      return { category: NotificationCategory.NEWS };
    }

    return { category: NotificationCategory.SYSTEM };
  }
}
