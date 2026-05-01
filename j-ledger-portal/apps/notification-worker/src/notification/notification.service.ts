import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { PushService } from '../push/push.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
  ) {}

  async handleEvent(topic: string, payload: any) {
    try {
      const { userId, eventType, referenceId, metadata, status } = payload;
      
      // Map legacy status if coming from KYC events
      const actualEventType = eventType || payload.status || 'NOTIFICATION';
      const actualReferenceId = referenceId || payload.documentId || payload.transactionId || Date.now().toString();
      
      const idempotencyKey = `${userId}:${actualEventType}:${actualReferenceId}`;

      // 1. Idempotency Check
      const existing = await this.prisma.notification.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        this.logger.debug(`Duplicate event ignored: ${idempotencyKey}`);
        return;
      }

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

      // 3. Persist to Inbox
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

      // 4. Routing Logic
      const isSecurityEvent = topic === 'security-events';
      let pushAttempted = false;
      let pushSuccess = false;

      // Push Strategy
      if (isSecurityEvent || prefs?.pushEnabled !== false) {
        if (devices.length > 0) {
          pushAttempted = true;
          for (const device of devices) {
            const ok = await this.pushService.sendPushNotification(
              device.pushToken!,
              title,
              body,
              { 
                ...metadata, 
                topic, 
                eventType: actualEventType,
                url: (actualEventType === 'TRANSFER' || actualEventType === 'TOPUP') && metadata?.transactionId
                  ? `/transaction/${metadata.transactionId}`
                  : undefined
              },
            );
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
        await this.emailService.sendEmail(
          user.email,
          title,
          this.wrapEmailHtml(title, body),
        );
      }

      this.logger.log(`Notification processed for user ${userId}: ${actualEventType}`);
    } catch (error) {
      this.logger.error(`Failed to handle notification event`, error);
    }
  }

  private generateTitle(topic: string, eventType: string, metadata: any): string {
    if (topic === 'security-events') return 'Security Alert';
    if (topic === 'kyc-events') return 'KYC Status Update';
    if (topic === 'transaction-events' || eventType === 'TOPUP' || eventType === 'TRANSFER') {
      if (eventType === 'TOPUP') return 'Top-up Successful';
      if (eventType === 'TRANSFER') return 'Transfer Successful';
      return 'Transaction Notification';
    }
    return 'J-Ledger Notification';
  }

  private generateBody(topic: string, eventType: string, metadata: any): string {
    switch (eventType) {
      case 'LOGIN_SUCCESS':
        return `New login detected from ${metadata?.ipAddress || 'unknown device'}.`;
      case 'APPROVED':
        return `Your verification has been approved.`;
      case 'REJECTED':
        return `Your verification was rejected. Reason: ${metadata?.reason || 'Please contact support'}.`;
      case 'TOPUP':
        return `Successfully topped up ฿${metadata?.amount || '0.00'}.`;
      case 'TRANSFER':
        const desc = metadata?.description ? ` (${metadata.description})` : '';
        return `Transaction complete: ฿${metadata?.amount || '0.00'}${desc}.`;
      default:
        return `You have a new update regarding your account.`;
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
  
  private getCategoryAndPath(eventType: string, metadata: any): { category: string; path?: string } {
    const type = eventType?.toUpperCase();
    
    // Default Category Mapping
    if (['TRANSFER', 'TOPUP', 'PAYMENT', 'FINANCE'].includes(type)) {
      const transactionId = metadata?.transactionId || metadata?.referenceId;
      return { 
        category: 'FINANCE', 
        path: transactionId ? `/transaction/${transactionId}` : undefined 
      };
    }
    
    if (['SECURITY', 'LOGIN_SUCCESS', 'PASSWORD_CHANGE'].includes(type)) {
      return { category: 'SYSTEM', path: '/profile/security' };
    }
    
    if (['KYC_STATUS', 'APPROVED', 'REJECTED'].includes(type)) {
      return { category: 'SYSTEM', path: '/profile/information' };
    }
    
    if (['PROMO', 'OFFER', 'CAMPAIGN'].includes(type)) {
      return { category: 'PROMO' };
    }
    
    if (['NEWS', 'ANNOUNCEMENT'].includes(type)) {
      return { category: 'NEWS' };
    }
    
    return { category: 'SYSTEM' };
  }
