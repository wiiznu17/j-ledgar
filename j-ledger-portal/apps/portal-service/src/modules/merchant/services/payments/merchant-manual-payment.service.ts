import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { FinanceService } from '../../../../core/finance/finance.service';
import { AuditService, AuditAction, ResourceType } from '../../../audit/audit.service';

@Injectable()
export class MerchantManualPaymentService {
  private readonly logger = new Logger(MerchantManualPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    private readonly auditService: AuditService,
  ) {}

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
}
