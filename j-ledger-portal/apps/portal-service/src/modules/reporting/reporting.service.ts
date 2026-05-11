import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { INTERNAL_API_PATHS } from '@repo/dto';

@Injectable()
export class ReportingService {
  private readonly apiGatewayUrl: string;
  private readonly internalSecret: string;
  private readonly logger = new Logger(ReportingService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiGatewayUrl = this.configService.get<string>(
      'FINANCE_SERVICE_URL',
      'http://localhost:8081',
    );
    this.internalSecret = this.configService.get<string>(
      'JLEDGER_INTERNAL_SECRET',
      'default_internal_secret',
    );
  }

  private async forwardToGateway<T = any>(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    paramsOrData?: unknown,
  ): Promise<T> {
    const url = `${this.apiGatewayUrl}${path}`;
    const headers = {
      'X-Internal-Secret': this.internalSecret,
    };

    const config: any = {
      method: method.toUpperCase(),
      url,
      headers,
    };

    if (method.toLowerCase() === 'get') {
      config.params = paramsOrData;
    } else {
      config.data = paramsOrData;
    }

    const response = await this.httpService.axiosRef.request<T>(config);
    return response.data;
  }

  // ==================== Daily Reports ====================

  async getDailyReport(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const query = new URLSearchParams({
      startDate: `${targetDate}T00:00:00`,
      endDate: `${targetDate}T23:59:59`,
    });

    const transactions = await this.forwardToGateway<any>(
      'get',
      `${INTERNAL_API_PATHS.FINANCE.TRANSACTIONS.BASE}?${query.toString()}`,
    );

    // Calculate metrics
    const content = transactions.content || transactions.data || [];
    const totalTransactions = content.length || 0;
    const totalAmount =
      content.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0;
    const avgAmount =
      totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Breakdown by type
    const byType =
      content.reduce((acc: any, tx: any) => {
        const type = tx.transactionType || tx.type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}) || {};

    // Breakdown by status
    const byStatus =
      content.reduce((acc: any, tx: any) => {
        acc[tx.status] = (acc[tx.status] || 0) + 1;
        return acc;
      }, {}) || {};

    return {
      date: targetDate,
      totalTransactions,
      totalAmount,
      avgAmount,
      byType,
      byStatus,
    };
  }

  // ==================== Monthly Reports ====================

  async getMonthlyReport(year?: number, month?: number) {
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`;

    // Get transactions from core-service for the month
    const query = new URLSearchParams({
      startDate,
      endDate,
    });

    const transactions = await this.forwardToGateway<any>(
      'get',
      `${INTERNAL_API_PATHS.FINANCE.TRANSACTIONS.BASE}?${query.toString()}`,
    );

    // Calculate metrics
    const content = transactions.content || transactions.data || [];
    const totalTransactions = content.length || 0;
    const totalAmount =
      content.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0;
    const avgAmount =
      totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Breakdown by type
    const byType =
      content.reduce((acc: any, tx: any) => {
        const type = tx.transactionType || tx.type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}) || {};

    // Breakdown by status
    const byStatus =
      content.reduce((acc: any, tx: any) => {
        acc[tx.status] = (acc[tx.status] || 0) + 1;
        return acc;
      }, {}) || {};

    return {
      year: targetYear,
      month: targetMonth,
      totalTransactions,
      totalAmount,
      avgAmount,
      byType,
      byStatus,
      revenue: totalAmount * 0.01, // Assuming 1% fee
    };
  }

  // ==================== User Statistics ====================

  async getUserStatistics() {
    // TODO: Get all users from identity module
    // For now, return placeholder data
    return {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      newUsers: 0,
      byStatus: {},
      kycStatus: {
        verified: 0,
        pending: 0,
        notStarted: 0,
      },
    };
  }

  // ==================== Reconciliation Reports ====================

  async getReconciliationReports(query: {
    page?: number;
    limit?: number;
    reportDate?: string;
    status?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 50;

    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };

    if (query.reportDate) params.reportDate = query.reportDate;
    if (query.status) params.status = query.status;

    return this.forwardToGateway<any>(
      'get',
      INTERNAL_API_PATHS.FINANCE.SYSTEM.RECONCILE.REPORTS,
      params,
    );
  }

  async getReconciliationReport(id: string) {
    return this.forwardToGateway<any>(
      'get',
      INTERNAL_API_PATHS.FINANCE.SYSTEM.RECONCILE.DETAIL(id),
    );
  }

  async runReconciliation() {
    return this.forwardToGateway<any>(
      'post',
      INTERNAL_API_PATHS.FINANCE.SYSTEM.RECONCILE.TRIGGER,
    );
  }

  async getOutbox(query?: {
    status?: string;
    eventType?: string;
    page?: number;
    limit?: number;
  }) {
    const params: Record<string, string> = {};
    if (query?.status) params.status = query.status;
    if (query?.eventType) params.eventType = query.eventType;
    if (query?.page) params.page = query.page.toString();
    if (query?.limit) params.limit = query.limit.toString();

    return this.forwardToGateway<any>(
      'get',
      INTERNAL_API_PATHS.FINANCE.SYSTEM.OUTBOX.BASE,
      params,
    );
  }

  async retryOutbox(id: string) {
    return this.forwardToGateway<any>(
      'post',
      INTERNAL_API_PATHS.FINANCE.SYSTEM.OUTBOX.RETRY(id),
    );
  }
}
