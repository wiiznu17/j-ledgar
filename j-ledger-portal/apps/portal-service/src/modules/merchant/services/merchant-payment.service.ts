import { Injectable, Logger } from '@nestjs/common';
import { MerchantQrPaymentService } from './payments/merchant-qr-payment.service';
import { MerchantManualPaymentService } from './payments/merchant-manual-payment.service';
import { MerchantTerminalPaymentService } from './payments/merchant-terminal-payment.service';
import { MerchantTerminalRedemptionService } from './payments/merchant-terminal-redemption.service';

@Injectable()
export class MerchantPaymentService {
  private readonly logger = new Logger(MerchantPaymentService.name);

  constructor(
    private readonly qrPaymentService: MerchantQrPaymentService,
    private readonly manualPaymentService: MerchantManualPaymentService,
    private readonly terminalPaymentService: MerchantTerminalPaymentService,
    private readonly terminalRedemptionService: MerchantTerminalRedemptionService,
  ) {}

  async generatePaymentQR(
    userId: string,
    merchantId: string,
    amount: number,
    terminalId?: string,
  ) {
    return this.qrPaymentService.generatePaymentQR(userId, merchantId, amount, terminalId);
  }

  async generateStaticQR(userId: string, merchantId: string) {
    return this.qrPaymentService.generateStaticQR(userId, merchantId);
  }

  async getPaymentDetail(paymentId: string) {
    return this.qrPaymentService.getPaymentDetail(paymentId);
  }

  async processQRPayment(userId: string, paymentId: string) {
    return this.qrPaymentService.processQRPayment(userId, paymentId);
  }

  async previewManualPayment(merchantId: string) {
    return this.manualPaymentService.previewManualPayment(merchantId);
  }

  async processManualPayment(
    userId: string,
    merchantId: string,
    amount: number,
    note?: string,
  ) {
    return this.manualPaymentService.processManualPayment(userId, merchantId, amount, note);
  }

  async getMerchantTransactions(userId: string, query: any) {
    return this.terminalPaymentService.getMerchantTransactions(userId, query);
  }

  async processTerminalPayment(
    terminalId: string,
    body: { amount: number; idempotencyKey: string; note?: string; customerToken?: string },
  ) {
    return this.terminalPaymentService.processTerminalPayment(terminalId, body);
  }

  async processTerminalRedemption(
    terminalId: string,
    body: { redemptionCode: string; idempotencyKey: string },
  ) {
    return this.terminalRedemptionService.processTerminalRedemption(terminalId, body);
  }

  async verifyRedemption(code: string, terminalId: string) {
    return this.terminalRedemptionService.verifyRedemption(code, terminalId);
  }

  async useRedemption(code: string, terminalId: string) {
    return this.terminalRedemptionService.useRedemption(code, terminalId);
  }
}
