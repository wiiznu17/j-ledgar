import { Controller, Get, UseGuards, Logger, Query } from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { IntegrationService } from '../../modules/integration/integration.service';
import { KycService } from '../../modules/kyc/kyc.service';
import { FinanceService } from 'src/modules/integration/finance.service';

@Controller('admin/dashboard')
@UseGuards(AdminJwtGuard, AdminRolesGuard)
export class AdminDashboardController {
  private readonly logger = new Logger(AdminDashboardController.name);

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly kycService: KycService,
    private readonly financeService: FinanceService,
  ) {}

  @Get('stats')
  async getDashboardStats(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    this.logger.log(`[AdminDashboard] Fetching aggregated stats from=${from} to=${to}`);

    // 1. Fetch KYC Stats (filtered by date)
    const kycStats = await this.kycService.getKYCStats(from, to);

    // 2. Fetch Recent Transactions to calculate volume for chart and period-based revenue
    const dateParams = new URLSearchParams();
    if (from) dateParams.set('from', from);
    if (to) dateParams.set('to', to);
    dateParams.set('page', '0');
    dateParams.set('size', '500'); // Increase size to get more data for charts when filtering

    const txResponse = await this.integrationService.forwardToGateway<any>(
      'get',
      `/api/v1/transactions?${dateParams.toString()}`,
    );
    const transactions = Array.isArray(txResponse)
      ? txResponse
      : txResponse.content || [];

    // Calculate revenue collected (sum of fees) in this period
    const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.fee || 0), 0);

    // 3. Fetch Financial Stats (VAT, Balance)
    const [vatAccounts, allAccounts] = await Promise.all([
      this.financeService.getAccountsByType('SYSTEM_VAT_PAYABLE'),
      this.integrationService.forwardToGateway<any>('get', '/api/v1/accounts?page=0&size=1000'),
    ]);

    const totalVatPayable = vatAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    
    const accountsList = Array.isArray(allAccounts) ? allAccounts : allAccounts.content || [];
    // Filter out BANK_CLEARING accounts (like SYSTEM_BANK_ACCOUNT) to prevent double counting assets vs liabilities
    const totalSystemBalance = accountsList
      .filter((acc) => acc.accountType !== 'BANK_CLEARING' && acc.accountName !== 'SYSTEM_BANK_ACCOUNT')
      .reduce((sum, acc) => sum + Number(acc.balance), 0);

    const chartData = this.processTransactionVolume(transactions, from, to);
    const distribution = this.calculateTransactionDistribution(transactions);

    // 4. Fetch Total Active Users
    const activeUsersCount = await this.kycService.getActiveUsersCount();

    // 5. Calculate Growth Stats
    const totalKyc = kycStats.approvedToday + kycStats.rejectedToday;
    const approvalRate =
      totalKyc > 0
        ? Math.round((kycStats.approvedToday / totalKyc) * 100)
        : 100;

    return {
      kyc: kycStats,
      financial: {
        totalRevenue,
        totalVatPayable,
        totalSystemBalance,
      },
      chartData,
      distribution,
      totalActiveUsers: activeUsersCount,
      growth: {
        approvalRate,
        volumeGoal: 65,
      },
    };
  }

  private calculateTransactionDistribution(transactions: any[]) {
    const counts: Record<string, number> = {
      TOPUP: 0,
      PAYMENT: 0,
      P2P_TRANSFER: 0,
      OTHER: 0,
    };

    transactions.forEach((tx) => {
      const rawType = tx.transactionType || tx.type;
      
      let mappedType = rawType;
      if (rawType === 'TRANSFER') {
        mappedType = 'P2P_TRANSFER';
      }

      if (mappedType && counts[mappedType] !== undefined) {
        counts[mappedType]++;
      } else {
        counts.OTHER++;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }

  private processTransactionVolume(transactions: any[], from?: string, to?: string) {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : new Date();

    let diffDays = -1; // Default to All Time
    if (fromDate) {
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const volumeMap: Record<string, number> = {};

    if (diffDays === -1) {
      // All Time: Group by Year (e.g. "2024", "2025", "2026")
      let minYear = new Date().getFullYear();
      let maxYear = new Date().getFullYear();

      if (transactions.length > 0) {
        const years = transactions.map((tx) => new Date(tx.createdAt).getFullYear());
        minYear = Math.min(...years);
        maxYear = Math.max(...years);
      }

      // Ensure at least a 3-year span for visual elegance
      if (minYear === maxYear) {
        minYear = minYear - 2;
      }

      for (let year = minYear; year <= maxYear; year++) {
        const label = `${year}`;
        volumeMap[label] = 0;
      }

      transactions.forEach((tx) => {
        const date = new Date(tx.createdAt);
        const label = `${date.getFullYear()}`;
        if (volumeMap[label] !== undefined) {
          volumeMap[label]++;
        }
      });
    } else if (diffDays <= 1) {
      // Today: Group by hour (all 24 hours of the calendar day, 00:00 to 23:00)
      for (let hour = 0; hour < 24; hour++) {
        const label = `${String(hour).padStart(2, '0')}:00`;
        volumeMap[label] = 0;
      }

      transactions.forEach((tx) => {
        const date = new Date(tx.createdAt);
        const label = `${String(date.getHours()).padStart(2, '0')}:00`;
        if (volumeMap[label] !== undefined) {
          volumeMap[label]++;
        }
      });
    } else if (diffDays <= 45) {
      // 30 Days: Group by Date (last 30 days)
      const now = toDate;
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 3600000);
        const label = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
        volumeMap[label] = 0;
      }

      transactions.forEach((tx) => {
        const date = new Date(tx.createdAt);
        const label = date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
        if (volumeMap[label] !== undefined) {
          volumeMap[label]++;
        }
      });
    } else {
      // 1 Year (365 days): Group by Month (last 12 months)
      const now = toDate;
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        volumeMap[label] = 0;
      }

      transactions.forEach((tx) => {
        const date = new Date(tx.createdAt);
        const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (volumeMap[label] !== undefined) {
          volumeMap[label]++;
        }
      });
    }

    return Object.entries(volumeMap).map(([time, volume]) => ({
      time,
      volume,
    }));
  }
}
