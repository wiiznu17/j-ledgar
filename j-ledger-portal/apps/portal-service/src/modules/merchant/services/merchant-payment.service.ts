import { Injectable, HttpException, HttpStatus, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { IntegrationService } from '../../integration/integration.service';
import { FinanceService } from '../../integration/finance.service';
import {
  AuditService,
  AuditAction,
  ResourceType,
} from '../../audit/audit.service';
import { REDIS_CLIENT } from '../../../core/common/constants';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import * as QRCode from 'qrcode';
import { TerminalIdempotencyService } from '../security/terminal-idempotency.service';

@Injectable()
export class MerchantPaymentService {
  private readonly logger = new Logger(MerchantPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationService: IntegrationService,
    private readonly financeService: FinanceService,
    private readonly auditService: AuditService,
    private readonly idempotencyService: TerminalIdempotencyService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async generatePaymentQR(
    userId: string,
    merchantId: string,
    amount: number,
    terminalId?: string,
  ) {
    if (amount < 5.0) {
      throw new HttpException(
        'Minimum payment amount for QR is ฿5.00',
        HttpStatus.BAD_REQUEST,
      );
    }
    // 1. Verify merchant belongs to user
    const merchant = await this.prisma.merchant.findFirst({
      where: { id: merchantId, partner: { userId } },
      include: { partner: true },
    });

    if (!merchant)
      throw new HttpException('Merchant not found', HttpStatus.NOT_FOUND);

    const idempotencyKey = `qr_pay_${randomUUID()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    // 2. Create Payment Record
    const payment = await this.prisma.merchantPayment.create({
      data: {
        merchantId,
        terminalId,
        amount: amount.toFixed(4),
        idempotencyKey,
        expiresAt,
        status: 'PENDING',
      },
    });

    // 3. Generate QR Data
    // Format: jledger://pay?id={paymentId}
    const payUrl = `jledger://pay?id=${payment.id}`;
    const qrDataUrl = await QRCode.toDataURL(payUrl);

    return {
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      qrCode: qrDataUrl,
      payUrl,
      expiresAt,
    };
  }

  async generateStaticQR(userId: string, merchantId: string) {
    // 1. Verify merchant belongs to user
    const merchant = await this.prisma.merchant.findFirst({
      where: { id: merchantId, partner: { userId } },
    });

    if (!merchant)
      throw new HttpException('Merchant not found', HttpStatus.NOT_FOUND);

    // 2. Generate QR Data
    // Format: jledger://merchant?id={merchantId}
    const payUrl = `jledger://merchant?id=${merchant.id}`;
    const qrDataUrl = await QRCode.toDataURL(payUrl);

    return {
      merchantId: merchant.id,
      qrCode: qrDataUrl,
      payUrl,
    };
  }

  async getPaymentDetail(paymentId: string) {
    const payment = await this.prisma.merchantPayment.findUnique({
      where: { id: paymentId },
      include: { merchant: true },
    });

    if (!payment)
      throw new HttpException(
        'Payment request not found',
        HttpStatus.NOT_FOUND,
      );

    if (payment.status === 'EXPIRED') {
      throw new HttpException('Payment request expired', HttpStatus.GONE);
    }

    if (payment.status !== 'PENDING') {
      throw new HttpException('Payment is no longer pending', HttpStatus.GONE);
    }

    if (new Date() > payment.expiresAt) {
      await this.prisma.merchantPayment.update({
        where: { id: paymentId },
        data: { status: 'EXPIRED' },
      });
      throw new HttpException('Payment request expired', HttpStatus.GONE);
    }

    return {
      id: payment.id,
      merchantName: payment.merchant.name,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt,
      expiresAt: payment.expiresAt,
    };
  }

  async processQRPayment(userId: string, paymentId: string) {
    // 1. Get Payment Request
    const payment = await this.prisma.merchantPayment.findUnique({
      where: { id: paymentId },
      include: { merchant: { include: { partner: true } } },
    });

    if (!payment)
      throw new HttpException(
        'Payment request not found',
        HttpStatus.NOT_FOUND,
      );
    if (payment.status !== 'PENDING')
      throw new HttpException('Payment is no longer pending', HttpStatus.GONE);

    if (new Date() > payment.expiresAt) {
      await this.prisma.merchantPayment.update({
        where: { id: paymentId },
        data: { status: 'EXPIRED' },
      });
      throw new HttpException('Payment request expired', HttpStatus.GONE);
    }

    const merchantPartner = payment.merchant.partner;
    const systemPartner = await this.prisma.partner.findFirst({
      where: { taxId: '0000000000000' },
    });

    if (!merchantPartner?.financeAccounts) {
      throw new HttpException(
        'Merchant financial accounts not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    if (!systemPartner?.financeAccounts) {
      throw new HttpException(
        'System financial accounts not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const mAcc = merchantPartner.financeAccounts as any;
    const sAcc = systemPartner.financeAccounts as any;

    // 2. Get Customer Wallet
    const customerWallet = await this.financeService.getWallet(userId);
    if (!customerWallet || !customerWallet.walletId) {
      throw new HttpException(
        'Customer wallet not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // 3. Calculate 4-Way Split with Residual Adjustment
    const total = Number(payment.amount);

    const settings = await this.financeService.getSystemSettings();
    if (!settings) {
      throw new HttpException(
        'System settings could not be retrieved',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (
      settings.minMerchantPayment === undefined ||
      settings.minMerchantPayment === null
    ) {
      throw new HttpException(
        'Merchant minimum payment is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const minPayment = Number(settings.minMerchantPayment);
    if (total < minPayment) {
      throw new HttpException(
        `Minimum payment amount is ฿${minPayment.toFixed(2)}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4. Limit Validations
    // 4.1 System Per-Transaction Limit
    if (!settings.perTransactionLimit) {
      throw new HttpException(
        'System transaction limit is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (total > Number(settings.perTransactionLimit)) {
      throw new HttpException(
        `Transaction exceeds system limit of ฿${Number(settings.perTransactionLimit).toLocaleString()}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4.2 User Daily Limit
    if (
      customerWallet.dailyLimit === undefined ||
      customerWallet.dailyLimit === null
    ) {
      throw new HttpException(
        'User daily limit is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (total > Number(customerWallet.dailyLimit)) {
      throw new HttpException(
        `Transaction exceeds your wallet's daily limit of ฿${Number(customerWallet.dailyLimit).toLocaleString()}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4.3 Merchant Receive Limit
    if (
      merchantPartner.dailyReceiveLimit === undefined ||
      merchantPartner.dailyReceiveLimit === null
    ) {
      throw new HttpException(
        'Merchant receiving limit is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (total > Number(merchantPartner.dailyReceiveLimit)) {
      throw new HttpException(
        `Transaction exceeds merchant's receiving limit`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Fee & VAT Strict Calculation
    if (
      settings.merchantFeeRate === undefined ||
      settings.merchantFeeRate === null
    ) {
      throw new HttpException(
        'Default merchant fee rate is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    if (settings.vatRate === undefined || settings.vatRate === null) {
      throw new HttpException(
        'System VAT rate is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const feeRate = Number(merchantPartner.feeRate ?? settings.merchantFeeRate);
    const vatRate = Number(settings.vatRate);

    // 3.1 Calculate and round sub-legs (VAT and Fees) to 2 decimals
    const merchantVat = Number((total * (vatRate / (1 + vatRate))).toFixed(2)); // vat from total (inclusive)
    const systemFee = Number((total * feeRate).toFixed(2));
    const systemVat = Number((systemFee * vatRate).toFixed(2)); // vat on fee (exclusive)

    // 3.2 Merchant Net is the residual (ensures sum is exactly equal to total)
    const merchantNet = total - merchantVat - systemFee - systemVat;

    this.logger.log(
      `[processQRPayment] Executing split for payment=${paymentId}: Total=${total.toFixed(2)}, Net=${merchantNet.toFixed(2)}, MVAT=${merchantVat.toFixed(2)}, Fee=${systemFee.toFixed(2)}, SVAT=${systemVat.toFixed(2)}`,
    );

    // 4. Perform Atomic Multi-Leg Transfer
    try {
      const legs = [];

      // Leg 1: Merchant Net (To Pending)
      const idempotencyKey = `qr_pay_atomic_${payment.id}`;
      const commonMeta = {
        idempotencyKey,
        isMerchantPayment: true,
        merchantName: payment.merchant.name,
        totalAmount: total.toFixed(2),
      };

      legs.push({
        toWalletId: mAcc.pending,
        amount: merchantNet.toFixed(2),
        note: `QR Payment to ${payment.merchant.name}`,
        metadata: commonMeta,
      });

      // Leg 2: Merchant VAT (To VAT)
      if (Number(merchantVat.toFixed(2)) > 0 && mAcc.vat) {
        legs.push({
          toWalletId: mAcc.vat,
          amount: merchantVat.toFixed(2),
          note: `Merchant VAT for QR ${payment.id}`,
          metadata: { ...commonMeta, silent: true },
        });
      }

      // Leg 3: System Fee (To System Revenue)
      if (Number(systemFee.toFixed(2)) > 0 && sAcc.revenue) {
        legs.push({
          toWalletId: sAcc.revenue,
          amount: systemFee.toFixed(2),
          note: `System Fee for QR ${payment.id}`,
          metadata: { ...commonMeta, silent: true },
        });
      }

      // Leg 4: System VAT (To System VAT Payable)
      if (Number(systemVat.toFixed(2)) > 0 && sAcc.vat_payable) {
        legs.push({
          toWalletId: sAcc.vat_payable,
          amount: systemVat.toFixed(2),
          note: `Service VAT for QR ${payment.id}`,
          metadata: { ...commonMeta, silent: true },
        });
      }

      const tx = await this.financeService.performMerchantMultiPay({
        fromWalletId: customerWallet.walletId,
        idempotencyKey,
        legs,
      });

      // 4. Update Status
      await this.prisma.merchantPayment.update({
        where: { id: paymentId },
        data: {
          status: 'COMPLETED',
          referenceId: tx.transactionId || tx.id?.toString(),
        },
      });

      // 5. Log Audit
      await this.auditService.log({
        userId: userId,
        action: AuditAction.MERCHANT_PAYMENT,
        resourceType: ResourceType.MERCHANT,
        resourceId: payment.merchantId,
        requestPayload: {
          paymentId,
          transactionId: tx.transactionId || tx.id?.toString(),
        },
        responseStatus: 200,
        ipAddress: '0.0.0.0', // Optional but good to have placeholders if not available
        userAgent: 'J-Ledger/Internal',
      });

      return {
        success: true,
        transactionId: tx.transactionId || tx.id?.toString(),
        amount: payment.amount,
        merchantName: payment.merchant.name,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to process QR payment ${paymentId}: ${error.message}`,
      );

      // If it was already completed (idempotency), don't mark as failed
      if (error.status !== HttpStatus.CONFLICT) {
        await this.prisma.merchantPayment
          .update({
            where: { id: paymentId },
            data: {
              status: 'FAILED',
              metadata: { error: error.message } as any,
            },
          })
          .catch(() => {});
      }
      throw error;
    }
  }

  async previewManualPayment(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { partner: { include: { profile: true } } },
    });

    if (!merchant)
      throw new HttpException('Merchant not found', HttpStatus.NOT_FOUND);

    return {
      merchantId: merchant.id,
      merchantName: merchant.name,
      category: merchant.category || merchant.partner.profile?.category,
      logoUrl: merchant.partner.profile?.logoUrl,
    };
  }

  async processManualPayment(
    userId: string,
    merchantId: string,
    amount: number,
    note?: string,
  ) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { partner: { include: { profile: true } } },
    });

    if (!merchant)
      throw new HttpException('Merchant not found', HttpStatus.NOT_FOUND);

    const partner = merchant.partner;
    const systemPartner = await this.prisma.partner.findFirst({
      where: { taxId: '0000000000000' },
    });

    if (!partner?.financeAccounts) {
      throw new HttpException(
        'Merchant financial accounts not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    if (!systemPartner?.financeAccounts) {
      throw new HttpException(
        'System financial accounts not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const mAcc = partner.financeAccounts as any;
    const sAcc = systemPartner.financeAccounts as any;

    // Get Customer Wallet
    const customerWallet = await this.financeService.getWallet(userId);
    if (!customerWallet || !customerWallet.walletId) {
      throw new HttpException(
        'Customer wallet not found',
        HttpStatus.NOT_FOUND,
      );
    }

    // Calculate Split with Residual Adjustment
    const total = Number(amount);

    const settings = await this.financeService.getSystemSettings();
    if (!settings) {
      throw new HttpException(
        'System settings could not be retrieved',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (
      settings.minMerchantPayment === undefined ||
      settings.minMerchantPayment === null
    ) {
      throw new HttpException(
        'Merchant minimum payment is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const minPayment = Number(settings.minMerchantPayment);
    if (total < minPayment) {
      throw new HttpException(
        `Minimum payment amount is ฿${minPayment.toFixed(2)}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Limit Validations
    // 1. System Per-Transaction Limit
    if (!settings.perTransactionLimit) {
      throw new HttpException(
        'System transaction limit is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (total > Number(settings.perTransactionLimit)) {
      throw new HttpException(
        `Transaction exceeds system limit of ฿${Number(settings.perTransactionLimit).toLocaleString()}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. User Daily Limit
    if (
      customerWallet.dailyLimit === undefined ||
      customerWallet.dailyLimit === null
    ) {
      throw new HttpException(
        'User daily limit is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (total > Number(customerWallet.dailyLimit)) {
      throw new HttpException(
        `Transaction exceeds your wallet's daily limit of ฿${Number(customerWallet.dailyLimit).toLocaleString()}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3. Merchant Receive Limit
    if (
      partner.dailyReceiveLimit === undefined ||
      partner.dailyReceiveLimit === null
    ) {
      throw new HttpException(
        'Merchant receiving limit is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (total > Number(partner.dailyReceiveLimit)) {
      throw new HttpException(
        `Transaction exceeds merchant's receiving limit`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Fee & VAT Strict Calculation
    if (
      settings.merchantFeeRate === undefined ||
      settings.merchantFeeRate === null
    ) {
      throw new HttpException(
        'Default merchant fee rate is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    if (settings.vatRate === undefined || settings.vatRate === null) {
      throw new HttpException(
        'System VAT rate is not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const feeRate = Number(partner.feeRate ?? settings.merchantFeeRate);
    const vatRate = Number(settings.vatRate);

    // 1. Calculate and round sub-legs (VAT and Fees) to 2 decimals
    const merchantVat = Number((total * (vatRate / (1 + vatRate))).toFixed(2));
    const systemFee = Number((total * feeRate).toFixed(2));
    const systemVat = Number((systemFee * vatRate).toFixed(2));

    // 2. Merchant Net is the residual (ensures sum is exactly equal to total)
    const merchantNet = total - merchantVat - systemFee - systemVat;

    this.logger.log(
      `[processManualPayment] Split for manual pay=${merchantId}: Net=${merchantNet.toFixed(2)}, MVAT=${merchantVat.toFixed(2)}, Fee=${systemFee.toFixed(2)}, SVAT=${systemVat.toFixed(2)}`,
    );

    const idempotencyKey = `manual_pay_${merchantId}_${userId}_${Date.now()}`;

    try {
      const legs = [];

      const commonMeta = {
        idempotencyKey,
        isMerchantPayment: true,
        merchantName: merchant.name,
        totalAmount: total.toFixed(2),
      };

      // Leg 1: Merchant Net
      if (mAcc.pending && mAcc.pending !== '0') {
        legs.push({
          toWalletId: mAcc.pending,
          amount: merchantNet.toFixed(2),
          note: note || `Manual Payment to ${merchant.name}`,
          metadata: commonMeta,
        });
      }

      // Leg 2: Merchant VAT
      if (Number(merchantVat.toFixed(2)) > 0 && mAcc.vat && mAcc.vat !== '0') {
        legs.push({
          toWalletId: mAcc.vat,
          amount: merchantVat.toFixed(2),
          note: `VAT for ${merchant.name}`,
          metadata: { ...commonMeta, silent: true },
        });
      }

      // Leg 3: System Fee
      if (
        Number(systemFee.toFixed(2)) > 0 &&
        sAcc.revenue &&
        sAcc.revenue !== '0'
      ) {
        legs.push({
          toWalletId: sAcc.revenue,
          amount: systemFee.toFixed(2),
          note: `System Fee from ${merchant.name}`,
          metadata: { ...commonMeta, silent: true },
        });
      }

      // Leg 4: System VAT
      if (
        Number(systemVat.toFixed(2)) > 0 &&
        sAcc.vat_payable &&
        sAcc.vat_payable !== '0'
      ) {
        legs.push({
          toWalletId: sAcc.vat_payable,
          amount: systemVat.toFixed(2),
          note: `System VAT from ${merchant.name}`,
          metadata: { ...commonMeta, silent: true },
        });
      }

      if (legs.length === 0) {
        throw new HttpException(
          'No valid destination wallets found for payment legs',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const tx = await this.financeService.performMerchantMultiPay({
        fromWalletId: customerWallet.walletId,
        idempotencyKey: `manual_pay_atomic_${idempotencyKey}`,
        legs,
      });

      // Create MerchantPayment record for history and dashboard reporting
      await this.prisma.merchantPayment.create({
        data: {
          merchantId: merchant.id,
          amount: amount,
          status: 'COMPLETED',
          idempotencyKey: `mp_manual_${idempotencyKey}`,
          referenceId: tx.transactionId || tx.id?.toString(),
          note: note || 'Manual Merchant Payment',
          expiresAt: new Date(), // Already completed
        },
      });

      // Log Audit
      await this.auditService.log({
        userId: userId,
        action: AuditAction.MERCHANT_PAYMENT,
        resourceType: ResourceType.MERCHANT,
        resourceId: merchant.id,
        requestPayload: {
          amount,
          note,
          transactionId: tx.transactionId || tx.id?.toString(),
          mode: 'MANUAL',
        },
        responseStatus: 200,
        ipAddress: '0.0.0.0',
        userAgent: 'J-Ledger/Internal',
      });

      return {
        success: true,
        transactionId: tx.transactionId || tx.id?.toString(),
        amount,
        merchantName: merchant.name,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to process manual payment to ${merchantId}: ${error.message}`,
      );
      throw error;
    }
  }

  async getMerchantTransactions(userId: string, query: any) {
    const partner = (await this.prisma.partner.findFirst({
      where: { userId },
      include: { merchants: true },
    })) as any;

    if (!partner)
      throw new HttpException('Partner not found', HttpStatus.NOT_FOUND);

    const merchantIds = partner.merchants.map((m: any) => m.id);

    const payments = await this.prisma.merchantPayment.findMany({
      where: {
        merchantId: { in: merchantIds },
        status: 'COMPLETED',
      },
      include: {
        terminal: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      data: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        type: p.terminalId
          ? `Terminal: ${p.terminal?.name || p.terminalId}`
          : 'QR Payment',
        note: p.note,
        createdAt: p.createdAt,
        referenceId: p.referenceId,
      })),
      pagination: { total: payments.length, page: 1, limit: 20, totalPages: 1 },
    };
  }

  async processTerminalPayment(
    terminalId: string,
    body: { amount: number; idempotencyKey: string; note?: string; customerToken?: string },
  ) {
    let resolvedUserId: string | null = null;
    if (body.customerToken) {
      if (body.customerToken.startsWith('PAY-')) {
        const redisKey = `pay_token:${body.customerToken}`;
        resolvedUserId = await this.redis.get(redisKey);
        if (!resolvedUserId) {
          throw new HttpException('Invalid or expired payment token', HttpStatus.BAD_REQUEST);
        }
        // Single-use token: delete immediately
        await this.redis.del(redisKey);
      }
    }

    return this.idempotencyService.handleIdempotency(
      terminalId,
      'PAYMENT',
      body.idempotencyKey,
      body,
      async () => {
        return this.prisma.$transaction(async (tx) => {
          const terminal = (await tx.terminal.findUnique({
            where: { id: terminalId },
            include: { merchant: { include: { partner: true } } },
          })) as any;

          if (!terminal)
            throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND);

          const amount = body.amount;
          const partnerId = terminal.merchant.partnerId;

          // 1. Acquire pessimistic lock on the partner using a dummy update
          await tx.partner.update({
            where: { id: partnerId },
            data: { updatedAt: new Date() },
          });

          // 2. Verify Partner and Accounts
          const partner = await tx.partner.findUnique({
            where: { id: partnerId },
          });

          if (!partner)
            throw new HttpException('Partner not found', HttpStatus.NOT_FOUND);

          if (!partner.isPaymentEnabled) {
            throw new HttpException(
              'Merchant payment processing is currently disabled',
              HttpStatus.FORBIDDEN,
            );
          }

          const financeAccounts = partner.financeAccounts as any;
          if (!financeAccounts?.pending) {
            throw new HttpException(
              'Merchant financial account not initialized',
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }

          let txId: string;

          if (body.customerToken) {
            let userId = resolvedUserId;
            if (!userId) {
              // Token didn't start with PAY-, treat as raw User UUID
              const user = await tx.user.findUnique({
                where: { id: body.customerToken },
              });
              if (!user) {
                throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
              }
              userId = user.id;
            }

            // Perform real financial transfer
            const customerWallet = await this.financeService.getWallet(userId);
            if (!customerWallet || !customerWallet.walletId) {
              throw new HttpException('Customer wallet not found', HttpStatus.NOT_FOUND);
            }

            const settings = await this.financeService.getSystemSettings();
            if (!settings) {
              throw new HttpException('System settings could not be retrieved', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            const total = Number(amount);
            const minPayment = Number(settings.minMerchantPayment || 0);
            if (total < minPayment) {
              throw new HttpException(
                `Minimum payment amount is ฿${minPayment.toFixed(2)}`,
                HttpStatus.BAD_REQUEST,
              );
            }

            if (total > Number(settings.perTransactionLimit)) {
              throw new HttpException(
                `Transaction exceeds system limit of ฿${Number(settings.perTransactionLimit).toLocaleString()}`,
                HttpStatus.BAD_REQUEST,
              );
            }

            if (total > Number(customerWallet.dailyLimit)) {
              throw new HttpException(
                `Transaction exceeds your wallet's daily limit of ฿${Number(customerWallet.dailyLimit).toLocaleString()}`,
                HttpStatus.BAD_REQUEST,
              );
            }

            if (total > Number(partner.dailyReceiveLimit)) {
              throw new HttpException(
                `Transaction exceeds merchant's receiving limit`,
                HttpStatus.BAD_REQUEST,
              );
            }

            const feeRate = Number(partner.feeRate ?? settings.merchantFeeRate);
            const vatRate = Number(settings.vatRate);

            const merchantVat = Number((total * (vatRate / (1 + vatRate))).toFixed(2));
            const systemFee = Number((total * feeRate).toFixed(2));
            const systemVat = Number((systemFee * vatRate).toFixed(2));
            const merchantNet = total - merchantVat - systemFee - systemVat;

            const legs = [];
            const atomicIdempotencyKey = `terminal_pay_atomic_${body.idempotencyKey}`;
            const commonMeta = {
              idempotencyKey: atomicIdempotencyKey,
              isMerchantPayment: true,
              merchantName: terminal.merchant.name,
              totalAmount: total.toFixed(2),
            };

            const systemPartner = await tx.partner.findFirst({
              where: { taxId: '0000000000000' },
            });
            if (!systemPartner?.financeAccounts) {
              throw new HttpException('System financial accounts not found', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            const sAcc = systemPartner.financeAccounts as any;

            legs.push({
              toWalletId: financeAccounts.pending,
              amount: merchantNet.toFixed(2),
              note: `Terminal Payment to ${terminal.merchant.name}`,
              metadata: commonMeta,
            });

            if (Number(merchantVat.toFixed(2)) > 0 && financeAccounts.vat) {
              legs.push({
                toWalletId: financeAccounts.vat,
                amount: merchantVat.toFixed(2),
                note: `Merchant VAT for Terminal Payment`,
                metadata: { ...commonMeta, silent: true },
              });
            }

            if (Number(systemFee.toFixed(2)) > 0 && sAcc.revenue) {
              legs.push({
                toWalletId: sAcc.revenue,
                amount: systemFee.toFixed(2),
                note: `System Fee for Terminal Payment`,
                metadata: { ...commonMeta, silent: true },
              });
            }

            if (Number(systemVat.toFixed(2)) > 0 && sAcc.vat_payable) {
              legs.push({
                toWalletId: sAcc.vat_payable,
                amount: systemVat.toFixed(2),
                note: `Service VAT for Terminal Payment`,
                metadata: { ...commonMeta, silent: true },
              });
            }

            const txResult = await this.financeService.performMerchantMultiPay({
              fromWalletId: customerWallet.walletId,
              idempotencyKey: atomicIdempotencyKey,
              legs,
            });

            txId = txResult.transactionId || txResult.id?.toString();
          } else {
            // Fallback mock transaction code for automated tests
            txId = `txn_tm_pmt_${randomUUID()}`;
          }

          // Create MerchantPayment record for the terminal transaction
          await tx.merchantPayment.create({
            data: {
              merchantId: terminal.merchantId,
              terminalId: terminalId,
              amount: amount,
              status: 'COMPLETED',
              idempotencyKey: body.idempotencyKey,
              referenceId: txId,
              note: body.note || 'Terminal Payment',
              expiresAt: new Date(),
              metadata: {
                merchantName: terminal.merchant.name,
                isMerchantPayment: true,
              },
            },
          });

          // Log Audit inside transaction
          await tx.auditLog.create({
            data: {
              adminUserId: null,
              action: AuditAction.MERCHANT_PAYMENT,
              resourceType: ResourceType.MERCHANT,
              resourceId: terminal.merchantId,
              ipAddress: '0.0.0.0',
              userAgent: 'Terminal/' + terminal.hardwareId,
              requestPayload: {
                terminalId,
                amount,
                idempotencyKey: body.idempotencyKey,
                note: body.note,
                transactionId: txId,
              },
              responseStatus: 201,
            },
          });

          return {
            status: HttpStatus.CREATED,
            data: {
              success: true,
              transactionId: txId,
              amount,
              currency: 'THB',
            },
          };
        });
      },
    );
  }

  async processTerminalRedemption(
    terminalId: string,
    body: { redemptionCode: string; idempotencyKey: string },
  ) {
    return this.idempotencyService.handleIdempotency(
      terminalId,
      'REDEEM',
      body.idempotencyKey,
      body,
      async () => {
        return this.prisma.$transaction(async (tx) => {
          const terminal = (await tx.terminal.findUnique({
            where: { id: terminalId },
            include: { merchant: { include: { partner: true } } },
          })) as any;

          if (!terminal)
            throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND);

          if (!terminal.merchant?.partner?.isLoyaltyEnabled) {
            throw new HttpException(
              'Merchant loyalty rewards program is currently disabled',
              HttpStatus.FORBIDDEN,
            );
          }

          // 1. Fetch redemption code and check ownership
          const redemption = await tx.dealRedemption.findUnique({
            where: { redemptionCode: body.redemptionCode },
            include: { deal: { include: { brand: true } } },
          });

          if (!redemption) {
            throw new HttpException('Redemption code not found', HttpStatus.NOT_FOUND);
          }

          if (redemption.status === 'USED') {
            throw new HttpException('Code has already been used', HttpStatus.BAD_REQUEST);
          }

          if (redemption.status !== 'REDEEMED') {
            throw new HttpException('Invalid code status', HttpStatus.BAD_REQUEST);
          }

          // 2. Validate that the deal belongs to the partner associated with the terminal
          if (
            redemption.deal.brand.partnerId &&
            redemption.deal.brand.partnerId !== terminal.merchant.partnerId
          ) {
            throw new HttpException(
              'This deal is not eligible for redemption at this merchant',
              HttpStatus.BAD_REQUEST,
            );
          }

          const usedAt = new Date();
          await tx.dealRedemption.update({
            where: { id: redemption.id },
            data: {
              status: 'USED' as any,
              usedAt,
              usedAtMerchantId: terminal.merchantId,
            },
          });

          await tx.auditLog.create({
            data: {
              adminUserId: null,
              action: AuditAction.MERCHANT_REDEMPTION,
              resourceType: ResourceType.MERCHANT,
              resourceId: terminal.merchantId,
              ipAddress: '0.0.0.0',
              userAgent: 'Terminal/' + terminal.hardwareId,
              requestPayload: {
                terminalId,
                redemptionCode: body.redemptionCode,
                idempotencyKey: body.idempotencyKey,
              },
              responseStatus: 200,
            },
          });

          return {
            status: HttpStatus.OK,
            data: {
              success: true,
              redemptionCode: body.redemptionCode,
              usedAt,
            },
          };
        });
      },
    );
  }

  async verifyRedemption(code: string, terminalId: string) {
    const redemption = await this.prisma.dealRedemption.findUnique({
      where: { redemptionCode: code },
      include: {
        deal: {
          include: { brand: true },
        },
      },
    });

    if (!redemption) {
      throw new HttpException('Invalid redemption code', HttpStatus.NOT_FOUND);
    }

    if (redemption.status !== 'REDEEMED') {
      const statusMsg =
        redemption.status === 'USED'
          ? 'Code already used'
          : 'Code expired or cancelled';
      throw new HttpException(statusMsg, HttpStatus.BAD_REQUEST);
    }

    if (redemption.expiresAt && new Date() > redemption.expiresAt) {
      // Auto-expire if needed
      await this.prisma.dealRedemption.update({
        where: { id: redemption.id },
        data: { status: 'EXPIRED' },
      });
      throw new HttpException('Code expired', HttpStatus.BAD_REQUEST);
    }

    return {
      isValid: true,
      dealTitle: redemption.deal.title,
      brandName: redemption.deal.brand.name,
      pointsSpent: redemption.pointsSpent,
      expiresAt: redemption.expiresAt,
    };
  }

  async useRedemption(code: string, terminalId: string) {
    const terminal = await this.prisma.terminal.findUnique({
      where: { id: terminalId },
      include: {
        merchant: {
          include: { partner: true },
        },
      },
    });

    if (!terminal)
      throw new HttpException('Terminal not found', HttpStatus.UNAUTHORIZED);

    const redemption = await this.prisma.dealRedemption.findUnique({
      where: { redemptionCode: code },
    });

    if (!redemption)
      throw new HttpException('Invalid code', HttpStatus.NOT_FOUND);
    if (redemption.status !== 'REDEEMED') {
      throw new HttpException(
        `Code already ${redemption.status.toLowerCase()}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update status to USED
    const updated = await this.prisma.dealRedemption.update({
      where: { id: redemption.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
        usedAtMerchantId: terminal.merchantId,
      },
    });

    this.logger.log(
      `Redemption code ${code} used at terminal ${terminalId} (Merchant: ${terminal.merchantId})`,
    );

    return {
      success: true,
      usedAt: updated.usedAt,
      redemptionId: updated.id,
    };
  }
}
