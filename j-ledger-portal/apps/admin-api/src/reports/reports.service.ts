import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { AuthProxyService } from '../proxies/auth-proxy.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly ledgerProxy: LedgerProxyService,
    private readonly authProxy: AuthProxyService,
  ) {}

  async getDailyReport(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get transactions from core-service for the specific date
    const transactions = await this.ledgerProxy.forwardToGateway<any>(
      'get',
      '/api/v1/transactions',
      { startDate: targetDate, endDate: targetDate },
    );

    // Calculate metrics
    const totalTransactions = transactions.data?.length || 0;
    const totalAmount = transactions.data?.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0;
    const avgAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Breakdown by type
    const byType = transactions.data?.reduce((acc: any, tx: any) => {
      acc[tx.transactionType] = (acc[tx.transactionType] || 0) + 1;
      return acc;
    }, {}) || {};

    // Breakdown by status
    const byStatus = transactions.data?.reduce((acc: any, tx: any) => {
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

  async getMonthlyReport(year?: number, month?: number) {
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth() + 1;
    
    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-31`;

    // Get transactions from core-service for the month
    const transactions = await this.ledgerProxy.forwardToGateway<any>(
      'get',
      '/api/v1/transactions',
      { startDate, endDate },
    );

    // Calculate metrics
    const totalTransactions = transactions.data?.length || 0;
    const totalAmount = transactions.data?.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0) || 0;
    const avgAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Breakdown by type
    const byType = transactions.data?.reduce((acc: any, tx: any) => {
      acc[tx.transactionType] = (acc[tx.transactionType] || 0) + 1;
      return acc;
    }, {}) || {};

    // Breakdown by status
    const byStatus = transactions.data?.reduce((acc: any, tx: any) => {
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

  async getUserStatistics() {
    // Get all users from auth-service
    const allUsers = await this.authProxy.getAllUsers({ page: 1, limit: 10000 });
    const totalUsers = allUsers.data?.length || 0;

    // Calculate status breakdown
    const byStatus = allUsers.data?.reduce((acc: any, user: any) => {
      acc[user.status] = (acc[user.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Calculate new users this month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const newUsers = allUsers.data?.filter((user: any) => 
      user.createdAt?.startsWith(currentMonth)
    ).length || 0;

    return {
      totalUsers,
      activeUsers: byStatus.ACTIVE || 0,
      inactiveUsers: (byStatus.INACTIVE || 0) + (byStatus.SUSPENDED || 0) + (byStatus.BLOCKED || 0),
      newUsers,
      byStatus,
      kycStatus: {
        verified: Math.floor(totalUsers * 0.6), // Placeholder - would need actual KYC data
        pending: Math.floor(totalUsers * 0.3),
        notStarted: Math.floor(totalUsers * 0.1),
      },
    };
  }
}
