import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    this.logger.log(`[createInvoice] Starting invoice creation for user=${dto.userId}`);
    const { items, ...rest } = dto;
    
    try {
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const tax = subtotal * 0.07;
      const total = subtotal + tax;
      this.logger.log(`[createInvoice] Totals calculated: subtotal=${subtotal}, total=${total}`);

      // Generate Invoice Number: INV-YYYYMMDD-XXXXXX-RAND
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const count = await this.prisma.invoice.count();
      const invoiceNumber = `INV-${datePart}-${(count + 1).toString().padStart(4, '0')}-${randomPart}`;
      this.logger.log(`[createInvoice] Generated unique number: ${invoiceNumber}`);

      const result = await this.prisma.invoice.create({
        data: {
          ...rest,
          invoiceNumber,
          amount: subtotal,
          tax,
          total,
          status: InvoiceStatus.PENDING,
          items: {
            create: items.map(item => ({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.unitPrice * item.quantity
            }))
          }
        },
        include: {
          items: true
        }
      });
      this.logger.log(`[createInvoice] Successfully created invoice: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`[createInvoice] CRITICAL ERROR: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getInvoiceById(id: string, userId: string) {
    this.logger.log(`[getInvoiceById] Searching invoice for user=${userId} with identifier="${id}"`);
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        userId,
        OR: [
          { id },
          { invoiceNumber: id },
          { referenceId: id }
        ]
      },
      include: { items: true }
    });

    if (!invoice) {
      this.logger.warn(`[getInvoiceById] Invoice NOT FOUND for user=${userId} with identifier="${id}"`);
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
    // In a real scenario, we might need a specific payment endpoint.
    // For now, we'll simulate it or use an internal transfer if it's a P2P bill.
    // Assuming finance service has a general payment method or we can use a reference.
    
    try {
      // Logic for finance-service payment call would go here
      // For MVP, we'll mark it as paid and simulate the transaction ID
      const mockTxId = `billing_pay_${id}_${Date.now()}`;
      
      const updatedInvoice = await this.prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
          referenceId: mockTxId
        }
      });

      this.logger.log(`Invoice ${invoice.invoiceNumber} paid by user ${userId}. Tx: ${mockTxId}`);
      
      return updatedInvoice;
    } catch (error) {
      this.logger.error(`Failed to pay invoice ${id}: ${error.message}`);
      throw new BadRequestException('Payment failed. Please check your balance.');
    }
  }
}
