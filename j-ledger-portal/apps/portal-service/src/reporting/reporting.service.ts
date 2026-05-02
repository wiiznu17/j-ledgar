import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class ReportingService {
  private readonly apiGatewayUrl: string;
  private readonly internalSecret: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiGatewayUrl = this.configService.get<string>('FINANCE_SERVICE_URL', 'http://localhost:8081');
    this.internalSecret = this.configService.get<string>(
      'JLEDGER_INTERNAL_SECRET',
      'default-secret',
    );
  }

  private async forwardToGateway<T = any>(
    method: 'get' | 'post' | 'put' | 'delete',
    path: string,
    data?: unknown,
  ): Promise<T> {
    const url = `${this.apiGatewayUrl}${path}`;
    const headers = {
      'X-Internal-Secret': this.internalSecret,
    };

    const response = await this.httpService.axiosRef.request<T>({
      method: method.toUpperCase(),
      url,
      data,
      headers,
    });

    return response.data;
  }

  // ==================== Daily Reports ====================

  async getDailyReport(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get transactions from core-service for the specific date
    const transactions = await this.forwardToGateway<any>('get', '/api/v1/transactions', {
      startDate: targetDate,
      endDate: targetDate,
    });

    // Calculate metrics
    const totalTransactions = transactions.data?.length || 0;
    const totalAmount =
      transactions.data?.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0;
    const avgAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Breakdown by type
    const byType =
      transactions.data?.reduce((acc: any, tx: any) => {
        acc[tx.transactionType] = (acc[tx.transactionType] || 0) + 1;
        return acc;
      }, {}) || {};

    // Breakdown by status
    const byStatus =
      transactions.data?.reduce((acc: any, tx: any) => {
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
    const transactions = await this.forwardToGateway<any>('get', '/api/v1/transactions', {
      startDate,
      endDate,
    });

    // Calculate metrics
    const totalTransactions = transactions.data?.length || 0;
    const totalAmount =
      transactions.data?.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0;
    const avgAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Breakdown by type
    const byType =
      transactions.data?.reduce((acc: any, tx: any) => {
        acc[tx.transactionType] = (acc[tx.transactionType] || 0) + 1;
        return acc;
      }, {}) || {};

    // Breakdown by status
    const byStatus =
      transactions.data?.reduce((acc: any, tx: any) => {
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

    return this.forwardToGateway<any>('get', '/api/v1/system/reconcile/reports', params);
  }

  async getReconciliationReport(id: string) {
    return this.forwardToGateway<any>('get', `/api/v1/system/reconcile/reports/${id}`);
  }

  async runReconciliation() {
    return this.forwardToGateway<any>('post', '/api/v1/system/reconcile/trigger');
  }

  async getOutbox() {
    return this.forwardToGateway<any[]>('get', '/api/v1/system/outbox');
  }
}
