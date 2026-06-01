import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { FinanceService } from '../../../../core/finance/finance.service';
import { AuditService, AuditAction, ResourceType } from '../../../audit/audit.service';
import { randomUUID } from 'crypto';
import * as QRCode from 'qrcode';

@Injectable()
export class MerchantQrPaymentService {
  private readonly logger = new Logger(MerchantQrPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    private readonly auditService: AuditService,
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
        ipAddress: '0.0.0.0',
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
}
