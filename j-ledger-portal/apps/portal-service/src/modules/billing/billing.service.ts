import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { FinanceService } from '../integration/finance.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
  ) {}

  async createInvoice(dto: CreateInvoiceDto) {
    this.logger.log(
      `[createInvoice] Starting invoice creation for user=${dto.userId}`,
    );
    const { items, ...rest } = dto;

    try {
      // Calculate totals with consistent rounding
      const subtotal = items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );
      const tax = Number((subtotal * 0.07).toFixed(2));
      const total = subtotal + tax;

      if (total < 5.00) {
        throw new BadRequestException('Minimum invoice amount is ฿5.00');
      }

      this.logger.log(
        `[createInvoice] Totals calculated: subtotal=${subtotal.toFixed(2)}, tax=${tax.toFixed(2)}, total=${total.toFixed(2)}`,
      );

      // Generate Invoice Number: INV-YYYYMMDD-XXXXXX-RAND
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      const count = await this.prisma.invoice.count();
      const invoiceNumber = `INV-${datePart}-${(count + 1).toString().padStart(4, '0')}-${randomPart}`;
      this.logger.log(
        `[createInvoice] Generated unique number: ${invoiceNumber}`,
      );

      // Calculate Platform Fees if partnerId is provided
      let feeRate = null;
      let feeAmount = null;
      let feeTax = null;

      if (dto.partnerId) {
        const partner = await this.prisma.partner.findUnique({
          where: { id: dto.partnerId },
        });
        if (partner) {
          feeRate = partner.feeRate;
          // Calculate fee from TOTAL amount (Gross) and round to 2 decimals
          feeAmount = Number((total * Number(feeRate)).toFixed(2));
          feeTax = Number((feeAmount * 0.07).toFixed(2));
          this.logger.log(`[createInvoice] Platform fees calculated: feeAmount=${feeAmount.toFixed(2)}, feeTax=${feeTax.toFixed(2)}`);
        }
      }

      const result = await this.prisma.invoice.create({
        data: {
          ...rest,
          invoiceNumber,
          amount: subtotal,
          tax,
          total,
          feeRate,
          feeAmount,
          feeTax,
          status: InvoiceStatus.PENDING,
          items: {
            create: items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.unitPrice * item.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      });
      this.logger.log(
        `[createInvoice] Successfully created invoice: ${result.id}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[createInvoice] CRITICAL ERROR: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getInvoiceById(id: string, userId: string) {
    this.logger.log(
      `[getInvoiceById] Searching invoice for user=${userId} with identifier="${id}"`,
    );
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        userId,
        OR: [{ id }, { invoiceNumber: id }, { referenceId: id }],
      },
      include: { items: true },
    });

    if (!invoice) {
      this.logger.warn(
        `[getInvoiceById] Invoice NOT FOUND for user=${userId} with identifier="${id}"`,
      );
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async payInvoice(id: string, userId: string) {
    const invoice = await this.getInvoiceById(id, userId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    // 1. Process payment with Finance Service
    try {
      if (invoice.partnerId) {
        // REAL SETTLEMENT & VAT SEPARATION
        const [userWallet, partner, systemPartner] = await Promise.all([
          this.financeService.getWallet(userId),
          this.prisma.partner.findUnique({ where: { id: invoice.partnerId } }),
          this.prisma.partner.findFirst({ where: { taxId: '0000000000000' } }),
        ]);

        if (!userWallet) throw new BadRequestException('Customer wallet not found');
        if (!partner || !partner.financeAccounts) throw new BadRequestException('Merchant accounts not found');
        if (!systemPartner || !systemPartner.financeAccounts) throw new BadRequestException('System accounts not found');

        const mAcc = partner.financeAccounts as any;
        const sAcc = systemPartner.financeAccounts as any;

        // Calculate Split (All based on rounded values recorded at creation)
        const total = Number(invoice.total);
        const merchantVat = Number(invoice.tax);
        const systemFee = Number(invoice.feeAmount || 0);
        const systemVat = Number(invoice.feeTax || 0);
        
        // Merchant Net is the residual to ensure total balance
        const merchantNet = total - merchantVat - systemFee - systemVat;
 
        this.logger.log(`[payInvoice] Executing 4-way split for invoice=${invoice.id}: Total=${total.toFixed(2)}, Net=${merchantNet.toFixed(2)}, MVAT=${merchantVat.toFixed(2)}, Fee=${systemFee.toFixed(2)}, SVAT=${systemVat.toFixed(2)}`);

        // Leg 1: Merchant Net (To Pending)
        await this.financeService.performTransfer({
          fromAccountId: userWallet.walletId,
          toAccountId: mAcc.pending,
          amount: merchantNet.toFixed(2),
          idempotencyKey: `pay_leg_net_${invoice.id}`,
          type: 'MERCHANT_PAYMENT',
          note: `Payment for INV ${invoice.invoiceNumber}`,
          metadata: { 
            isMerchantPayment: true,
            totalAmount: total.toFixed(2)
          }
        });

        // Leg 2: Merchant VAT (To VAT)
        if (Number(merchantVat.toFixed(2)) > 0 && mAcc.vat) {
          await this.financeService.performTransfer({
            fromAccountId: userWallet.walletId,
            toAccountId: mAcc.vat,
            amount: merchantVat.toFixed(2),
            idempotencyKey: `pay_leg_vat_${invoice.id}`,
            type: 'MERCHANT_PAYMENT',
            note: `VAT for INV ${invoice.invoiceNumber}`,
            metadata: { silent: true, isMerchantPayment: true, parentIdempotencyKey: `pay_leg_net_${invoice.id}` }
          });
        }

        // Leg 3: System Fee (To System Revenue)
        if (Number(systemFee.toFixed(2)) > 0 && sAcc.revenue) {
          await this.financeService.performTransfer({
            fromAccountId: userWallet.walletId,
            toAccountId: sAcc.revenue,
            amount: systemFee.toFixed(2),
            idempotencyKey: `pay_leg_fee_${invoice.id}`,
            type: 'MERCHANT_PAYMENT',
            note: `Fee for INV ${invoice.invoiceNumber}`,
            metadata: { silent: true, isMerchantPayment: true, parentIdempotencyKey: `pay_leg_net_${invoice.id}` }
          });
        }

        // Leg 4: System VAT (To System VAT Payable)
        if (Number(systemVat.toFixed(2)) > 0 && sAcc.vat_payable) {
          await this.financeService.performTransfer({
            fromAccountId: userWallet.walletId,
            toAccountId: sAcc.vat_payable,
            amount: systemVat.toFixed(2),
            idempotencyKey: `pay_leg_svat_${invoice.id}`,
            type: 'MERCHANT_PAYMENT',
            note: `Service VAT for INV ${invoice.invoiceNumber}`,
            metadata: { silent: true, isMerchantPayment: true, parentIdempotencyKey: `pay_leg_net_${invoice.id}` }
          });
        }
      }

      const updatedInvoice = await this.prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
          referenceId: `SPLIT_PAY_${invoice.id}`,
        },
        include: { items: true },
      });

      this.logger.log(`[payInvoice] Successfully processed payment for invoice: ${id}`);
      return updatedInvoice;
    } catch (error) {
      this.logger.error(`[payInvoice] Payment failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
