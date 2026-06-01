import { Injectable } from '@nestjs/common';
import { StripeIntegrationService } from './services/stripe-integration.service';
import { P2PTransferService } from './services/p2p-transfer.service';
import { TransactionHistoryService } from './services/transaction-history.service';
import { DashboardBffService } from './services/dashboard-bff.service';
import { BankIntegrationService } from './services/bank-integration.service';
import { WebhookConfigService } from './services/webhook-config.service';
import { StatementExportService } from './services/statement-export.service';

@Injectable()
export class IntegrationService {
  constructor(
    private readonly stripeService: StripeIntegrationService,
    private readonly p2pService: P2PTransferService,
    private readonly historyService: TransactionHistoryService,
    private readonly dashboardService: DashboardBffService,
    private readonly bankService: BankIntegrationService,
    private readonly webhookService: WebhookConfigService,
    private readonly statementService: StatementExportService,
  ) {}

  // ==================== Stripe Integration ====================

  async getStripeBalance() {
    return this.stripeService.getStripeBalance();
  }

  async createStripeTopupIntent(
    userId: string,
    amount: number,
    currency: string = 'THB',
    note?: string,
  ) {
    return this.stripeService.createStripeTopupIntent(userId, amount, currency, note);
  }

  async getTopupOrderStatus(userId: string, orderId: string) {
    return this.stripeService.getTopupOrderStatus(userId, orderId);
  }

  async processStripeWebhook(signature: string | undefined, rawBody: Buffer) {
    return this.stripeService.processStripeWebhook(signature, rawBody);
  }

  // ==================== P2P Transfer & Favorites ====================

  async previewP2PTransfer(
    userId: string,
    body: { recipientPhone: string; amount: number },
  ) {
    return this.p2pService.previewP2PTransfer(userId, body);
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
    return this.p2pService.transferP2P(userId, body);
  }

  async getFavoriteRecipients(userId: string): Promise<any[]> {
    return this.p2pService.getFavoriteRecipients(userId);
  }

  async addFavoriteRecipient(
    userId: string,
    body: { recipientPhone: string; nickname?: string },
  ): Promise<any> {
    return this.p2pService.addFavoriteRecipient(userId, body);
  }

  async deleteFavoriteRecipient(userId: string, id: string): Promise<any> {
    return this.p2pService.deleteFavoriteRecipient(userId, id);
  }

  // ==================== Transaction History ====================

  async getHistory(
    userId: string,
    query: {
      page?: number;
      size?: number;
      type?: 'TOPUP' | 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL';
      q?: string;
      from?: string;
      to?: string;
    },
  ) {
    return this.historyService.getHistory(userId, query);
  }

  async getTransactionDetails(transactionId: string, userId?: string) {
    return this.historyService.getTransactionDetails(transactionId, userId);
  }

  // ==================== Dashboard BFF ====================

  async getDashboardData(userId: string) {
    return this.dashboardService.getDashboardData(userId);
  }

  async getLinkedBankAccounts(userId: string) {
    return this.dashboardService.getLinkedBankAccounts(userId);
  }

  async topUp(userId: string, amount: number, bankAccountId: number) {
    return this.dashboardService.topUp(userId, amount, bankAccountId);
  }

  // ==================== Bank Integration CRUD ====================

  async getBankIntegrations() {
    return this.bankService.getBankIntegrations();
  }

  async createBankIntegration(data: any) {
    return this.bankService.createBankIntegration(data);
  }

  async updateBankIntegration(id: string, data: any) {
    return this.bankService.updateBankIntegration(id, data);
  }

  async deleteBankIntegration(id: string) {
    return this.bankService.deleteBankIntegration(id);
  }

  // ==================== Webhooks CRUD ====================

  async createWebhook(data: any) {
    return this.webhookService.createWebhook(data);
  }

  async getWebhooks() {
    return this.webhookService.getWebhooks();
  }

  async deleteWebhook(id: string) {
    return this.webhookService.deleteWebhook(id);
  }

  // ==================== Statement Export ====================

  async requestStatementExport(userId: string, body: { year: number; month: number }) {
    return this.statementService.requestStatementExport(userId, body);
  }

  // ==================== Ledger Proxy Helpers ====================

  async forwardToGateway<T = any>(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    data?: unknown,
    customerAccountId?: string,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    return this.historyService.forwardToGateway<T>(
      method,
      path,
      data,
      customerAccountId,
      extraHeaders,
    );
  }

  async getAccountByUserId(userId: string) {
    return this.historyService.getAccountByUserId(userId);
  }

  async get(path: string) {
    return this.historyService.get(path);
  }
}
