import { Injectable, Logger } from '@nestjs/common';
import { MerchantApplicationService } from './services/merchant-application.service';
import { MerchantPartnerService } from './services/merchant-partner.service';
import { MerchantPosService } from './services/merchant-pos.service';
import { MerchantPaymentService } from './services/merchant-payment.service';
import { MerchantSettlementService } from './services/merchant-settlement.service';

/**
 * MerchantFacade serves as the entry point for all merchant-related operations,
 * delegating specific logic to the appropriate sub-services.
 */
@Injectable()
export class MerchantService {
  private readonly logger = new Logger(MerchantService.name);

  constructor(
    private readonly applicationService: MerchantApplicationService,
    private readonly partnerService: MerchantPartnerService,
    private readonly posService: MerchantPosService,
    private readonly paymentService: MerchantPaymentService,
    private readonly settlementService: MerchantSettlementService,
  ) {}

  // --- Delegation Methods ---

  async validateTerminalSignature(terminalId: string, signature: string, timestamp: string, nonce: string, method: string, path: string) {
    return this.posService.validateTerminalSignature(terminalId, signature, timestamp, nonce, method, path);
  }

  async findAllPartners(query: any) {
    return this.partnerService.findAllPartners(query);
  }

  async findApplications(query: any) {
    return this.applicationService.findApplications(query);
  }

  async updatePartner(id: string, data: any) {
    return this.partnerService.updatePartner(id, data);
  }

  async findPartnerById(id: string) {
    return this.partnerService.findPartnerById(id);
  }

  async findPartnerMerchants(partnerId: string) {
    return this.partnerService.findPartnerMerchants(partnerId);
  }

  async findTerminalsByMerchantId(merchantId: string) {
    return this.posService.findTerminalsByMerchantId(merchantId);
  }

  async reviewApplication(id: string, body: any) {
    return this.applicationService.reviewApplication(id, body);
  }

  async updatePartnerStatus(id: string, status: boolean) {
    return this.partnerService.updatePartnerStatus(id, status);
  }

  async createTerminal(merchantId: string, body: any) {
    return this.posService.createTerminal(merchantId, body);
  }

  async getMerchantTerminals(merchantUserId: string) {
    return this.posService.getMerchantTerminals(merchantUserId);
  }

  async generatePaymentQR(userId: string, merchantId: string, amount: number, terminalId?: string) {
    return this.paymentService.generatePaymentQR(userId, merchantId, amount, terminalId);
  }

  async generateStaticQR(userId: string, merchantId: string) {
    return this.paymentService.generateStaticQR(userId, merchantId);
  }

  async getPaymentDetail(paymentId: string) {
    return this.paymentService.getPaymentDetail(paymentId);
  }

  async processQRPayment(userId: string, paymentId: string) {
    return this.paymentService.processQRPayment(userId, paymentId);
  }

  async previewManualPayment(merchantId: string) {
    return this.paymentService.previewManualPayment(merchantId);
  }

  async processManualPayment(userId: string, merchantId: string, amount: number, note?: string) {
    return this.paymentService.processManualPayment(userId, merchantId, amount, note);
  }

  async getMerchantDashboard(userId: string) {
    return this.applicationService.getMerchantDashboard(userId);
  }

  async applyMerchant(userId: string, body: any) {
    return this.applicationService.applyMerchant(userId, body);
  }

  async getMerchantTransactions(userId: string, query: any) {
    return this.paymentService.getMerchantTransactions(userId, query);
  }

  async processTerminalPayment(terminalId: string, body: any) {
    return this.paymentService.processTerminalPayment(terminalId, body);
  }

  async processTerminalRedemption(terminalId: string, body: any) {
    return this.paymentService.processTerminalRedemption(terminalId, body);
  }

  async runDailySettlement() {
    return this.settlementService.runDailySettlement();
  }

  async runSettlementForPartner(partnerId: string) {
    return this.settlementService.runSettlementForPartner(partnerId);
  }

  async getSettlementHistory(page?: number, limit?: number, search?: string, sortBy?: string, sortOrder?: string) {
    return this.settlementService.getSettlementHistory(page, limit, search, sortBy, sortOrder);
  }

  async createPartnerManual(data: any) {
    return this.partnerService.createPartnerManual(data);
  }

  async createMerchant(partnerId: string, body: any) {
    return this.partnerService.createMerchant(partnerId, body);
  }

  async rotateTerminalSecret(terminalId: string) {
    return this.posService.rotateTerminalSecret(terminalId);
  }

  async verifyRedemption(code: string, terminalId: string) {
    return this.paymentService.verifyRedemption(code, terminalId);
  }

  async useRedemption(code: string, terminalId: string) {
    return this.paymentService.useRedemption(code, terminalId);
  }
}
