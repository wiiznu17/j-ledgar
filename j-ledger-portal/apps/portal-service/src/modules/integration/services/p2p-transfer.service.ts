import { HttpException, HttpStatus, Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { FinanceService } from '../finance.service';
import { BillingService } from '../../billing/billing.service';
import { LoyaltyService } from '../../loyalty/loyalty.service';
import { FraudService } from '../../fraud/fraud.service';
import { ConfigService } from '@nestjs/config';
import { FraudRuleAction } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';

@Injectable()
export class P2PTransferService {
  private readonly logger = new Logger(P2PTransferService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    @Inject(forwardRef(() => BillingService))
    private readonly billingService: BillingService,
    private readonly loyaltyService: LoyaltyService,
    private readonly fraudService: FraudService,
    private readonly configService: ConfigService,
  ) {}

  async previewP2PTransfer(
    userId: string,
    body: { recipientPhone: string; amount: number },
  ) {
    const recipientPhone = this.normalizePhone(body.recipientPhone);
    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new HttpException(
        'Invalid transfer amount',
        HttpStatus.BAD_REQUEST,
      );
    }

    const settings = await this.financeService.getSystemSettings();
    if (!settings) {
      throw new HttpException(
        'System settings could not be retrieved',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const minP2p = Number(settings.minP2pTransfer);
    if (
      settings.minP2pTransfer === undefined ||
      settings.minP2pTransfer === null
    ) {
      throw new HttpException(
        'P2P minimum transfer limit is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (amount < minP2p) {
      throw new HttpException(
        { message: `Minimum transfer amount is ฿${minP2p.toFixed(2)}` },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!settings.perTransactionLimit) {
      throw new HttpException(
        'System transaction limit is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (amount > Number(settings.perTransactionLimit)) {
      throw new HttpException(
        {
          message: `Transfer exceeds system limit of ฿${Number(settings.perTransactionLimit).toLocaleString()}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const userWallet = await this.financeService.getWallet(userId);
    if (userWallet?.dailyLimit && amount > Number(userWallet.dailyLimit)) {
      throw new HttpException(
        {
          message: `Transfer exceeds your wallet's daily limit of ฿${Number(userWallet.dailyLimit).toLocaleString()}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const recipientUser = await this.findUserByPhone(recipientPhone);
    if (!recipientUser) {
      this.logger.warn(
        `[P2PPreview] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} outcome=recipient_not_found`,
      );
      throw new HttpException(
        {
          message:
            'Recipient not found. This phone number is not registered in the system.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      const preview = await this.financeService.previewP2PTransfer(userId, {
        recipientPhone,
        amount: amount.toFixed(4),
      });

      const recipientUserId = preview?.recipient?.userId;
      const recipientProfile = recipientUserId
        ? await this.prisma.kYCData
            .findUnique({ where: { userId: recipientUserId } })
            .catch(() => null)
        : null;

      this.logger.log(
        `[P2PPreview] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} amount=${amount.toFixed(2)} outcome=success`,
      );

      return {
        recipient: {
          userId: recipientUserId,
          phoneMasked:
            preview?.recipient?.phoneMasked || this.maskPhone(recipientPhone),
          displayName: recipientProfile?.idCardName || null,
        },
        amount: preview?.amount ?? amount.toFixed(4),
        fee: preview?.fee ?? '0.0000',
        totalDebit: preview?.totalDebit ?? amount.toFixed(4),
        currency: preview?.currency ?? 'THB',
      };
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to preview transfer';
      this.logger.error(
        `[P2PPreview] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} amount=${amount.toFixed(2)} outcome=failed message="${message}"`,
      );
      if (message.toLowerCase().includes('recipient not found')) {
        throw new HttpException(
          {
            message:
              'Recipient not found. This phone number is not registered in the system.',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        { message },
        error?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async transferP2P(
    userId: string,
    body: {
      recipientPhone: string;
      amount: number;
      note?: string;
      idempotencyKey: string;
    },
  ) {
    const recipientPhone = this.normalizePhone(body.recipientPhone);
    const amount = Number(body.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new HttpException(
        'Invalid transfer amount',
        HttpStatus.BAD_REQUEST,
      );
    }

    const settings = await this.financeService.getSystemSettings();
    if (!settings) {
      throw new HttpException(
        'System settings could not be retrieved',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const minP2p = Number(settings.minP2pTransfer);
    if (
      settings.minP2pTransfer === undefined ||
      settings.minP2pTransfer === null
    ) {
      throw new HttpException(
        'P2P minimum transfer limit is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (amount < minP2p) {
      throw new HttpException(
        { message: `Minimum transfer amount is ฿${minP2p.toFixed(2)}` },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!settings.perTransactionLimit) {
      throw new HttpException(
        'System transaction limit is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (amount > Number(settings.perTransactionLimit)) {
      throw new HttpException(
        {
          message: `Transfer exceeds system limit of ฿${Number(settings.perTransactionLimit).toLocaleString()}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const userWallet = await this.financeService.getWallet(userId);
    if (userWallet?.dailyLimit && amount > Number(userWallet.dailyLimit)) {
      throw new HttpException(
        {
          message: `Transfer exceeds your wallet's daily limit of ฿${Number(userWallet.dailyLimit).toLocaleString()}`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const fraudResult = await this.fraudService.evaluateTransaction({
      userId,
      amount,
      type: 'P2P_TRANSFER',
      metadata: { recipientPhone },
    });

    if (fraudResult && fraudResult.action === FraudRuleAction.BLOCK) {
      this.logger.error(
        `[P2PTransfer] BLOCKED by fraud rule for user ${userId}`,
      );
      throw new HttpException(
        {
          message:
            'Transaction blocked due to suspicious activity. Please contact support.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    if (!body.idempotencyKey) {
      throw new HttpException(
        { message: 'idempotencyKey is required' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const recipientUser = await this.findUserByPhone(recipientPhone);
    if (!recipientUser) {
      this.logger.warn(
        `[P2PTransfer] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} outcome=recipient_not_found`,
      );
      throw new HttpException(
        {
          message:
            'Recipient not found. This phone number is not registered in the system.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    try {
      const [senderProfile, recipientProfile] = await Promise.all([
        this.prisma.kYCData.findUnique({ where: { userId } }).catch(() => null),
        this.prisma.kYCData
          .findUnique({ where: { userId: recipientUser.id } })
          .catch(() => null),
      ]);

      const senderName = senderProfile?.idCardName || 'User';
      const recipientName = recipientProfile?.idCardName || recipientPhone;

      const tx = await this.financeService.transferByPhone(userId, {
        recipientPhone,
        amount: amount.toFixed(4),
        note: body.note,
        idempotencyKey: body.idempotencyKey,
        metadata: {
          senderName,
          recipientName,
          senderPhone: (
            await this.prisma.user.findUnique({ where: { id: userId } })
          )?.phoneNumber,
          recipientPhone: recipientPhone,
        },
      });

      const metadata = this.parseMetadata(tx?.metadata);
      const recipientUserId = metadata?.recipientUserId || recipientUser.id;

      const finalTxId = tx?.transactionId || tx?.id?.toString();

      await this.prisma.auditLog
        .create({
          data: {
            userId,
            action: 'P2P_TRANSFER',
            resourceType: 'TRANSACTION',
            resourceId: finalTxId,
            requestPayload: { ...body },
            changes: { transactionId: finalTxId },
            responseStatus: 200,
          },
        })
        .catch((err) =>
          this.logger.error(
            `[P2PTransfer] Audit logging failed: ${err.message}`,
          ),
        );

      this.logger.log(
        `[P2PTransfer] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} amount=${amount.toFixed(2)} outcome=success txn=${finalTxId}`,
      );

      const result = {
        transactionId: finalTxId,
        status: tx?.status || 'COMPLETED',
        amount: Number(tx?.amount || amount).toFixed(4),
        fee: '0.0000',
        totalDebit: Number(tx?.amount || amount).toFixed(4),
        currency: 'THB',
        recipient: {
          userId: recipientUserId || null,
          phoneMasked: this.maskPhone(recipientPhone),
          displayName: recipientProfile?.idCardName || null,
        },
        createdAt: tx?.createdAt || new Date().toISOString(),
      };

      try {
        await this.billingService.createInvoice({
          userId,
          senderName: 'J-Ledger Wallet',
          note: body.note,
          referenceId: finalTxId,
          items: [
            {
              name: `P2P Transfer to ${recipientProfile?.idCardName || recipientPhone}`,
              quantity: 1,
              unitPrice: amount,
            },
          ],
        });
      } catch (err) {
        this.logger.error(
          `[P2PTransfer] Invoice creation failed: ${err.message}`,
        );
      }

      try {
        const pointsEarned = await this.loyaltyService.earnPoints(
          userId,
          amount,
          'P2P_TRANSFER',
          `P2P Transfer to ${recipientProfile?.idCardName || recipientPhone}`,
          finalTxId,
        );

        if (pointsEarned) {
          this.logger.log(`Loyalty points earned for transaction ${finalTxId}`);
        }
      } catch (err) {
        this.logger.error(`[P2PTransfer] Point earning failed: ${err.message}`);
      }

      return result;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to transfer';
      this.logger.error(
        `[P2PTransfer] user=${userId} recipientHash=${this.hashPhone(recipientPhone)} amount=${amount.toFixed(2)} outcome=failed message="${message}"`,
      );
      if (message.toLowerCase().includes('recipient not found')) {
        throw new HttpException(
          {
            message:
              'Recipient not found. This phone number is not registered in the system.',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      throw new HttpException(
        { message },
        error?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getFavoriteRecipients(userId: string): Promise<any[]> {
    return this.prisma.favoriteRecipient.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFavoriteRecipient(
    userId: string,
    body: { recipientPhone: string; nickname?: string },
  ): Promise<any> {
    const phone = this.normalizePhone(body.recipientPhone);
    const recipientUser = await this.findUserByPhone(phone);
    if (!recipientUser) {
      throw new HttpException(
        'เบอร์โทรศัพท์ปลายทางไม่ได้ลงทะเบียนในระบบ P-Wallet',
        HttpStatus.NOT_FOUND,
      );
    }

    if (recipientUser.id === userId) {
      throw new HttpException(
        'ไม่สามารถเพิ่มเบอร์ของตนเองเป็นรายการโปรดได้',
        HttpStatus.BAD_REQUEST,
      );
    }

    const recipientProfile = await this.prisma.kYCData
      .findUnique({ where: { userId: recipientUser.id } })
      .catch(() => null);
    
    const recipientName = recipientProfile?.idCardName || phone;

    return this.prisma.favoriteRecipient.upsert({
      where: {
        userId_recipientPhone: {
          userId,
          recipientPhone: phone,
        },
      },
      update: {
        recipientName,
        nickname: body.nickname || null,
      },
      create: {
        userId,
        recipientPhone: phone,
        recipientName,
        nickname: body.nickname || null,
      },
    });
  }

  async deleteFavoriteRecipient(userId: string, id: string): Promise<any> {
    const favorite = await this.prisma.favoriteRecipient.findFirst({
      where: { id, userId },
    });

    if (!favorite) {
      throw new HttpException(
        'ไม่พบรายการผู้รับที่ชื่นชอบ',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.favoriteRecipient.delete({
      where: { id },
    });

    return { success: true };
  }

  // P2P Helpers
  normalizePhone(phone: string) {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.length === 9) {
      return `0${digits}`;
    }
    return digits;
  }

  maskPhone(phone: string) {
    if (!phone || phone.length < 6) {
      return phone;
    }
    return `${phone.slice(0, 3)}-***-${phone.slice(-3)}`;
  }

  hashPhone(phone: string) {
    return createHash('sha256')
      .update(phone || '')
      .digest('hex')
      .slice(0, 10);
  }

  getPhoneCandidates(phone: string): string[] {
    const digits = (phone || '').replace(/\D/g, '');
    const candidates = [phone];
    if (digits.length === 10 && digits.startsWith('0')) {
      candidates.push(digits);
      candidates.push(`+66${digits.slice(1)}`);
    }
    if (digits.length === 11 && digits.startsWith('66')) {
      candidates.push(`+${digits}`);
      candidates.push(`0${digits.slice(2)}`);
    }
    return [...new Set(candidates)];
  }

  async findUserByPhone(phone: string) {
    const candidates = this.getPhoneCandidates(phone);
    return this.prisma.user.findFirst({
      where: { phoneNumber: { in: candidates } },
    });
  }

  private parseMetadata(raw: unknown): Record<string, any> {
    const parsed = (() => {
      if (!raw) return {};
      if (typeof raw === 'object') return raw as Record<string, any>;
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch {
          return {};
        }
      }
      return {};
    })();

    if (parsed.extra && typeof parsed.extra === 'string') {
      try {
        const extra = JSON.parse(parsed.extra);
        return { ...parsed, ...extra };
      } catch {
        // ignore
      }
    }
    return parsed;
  }
}
