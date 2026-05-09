import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { IntegrationService } from '../../modules/integration/integration.service';
import { KycService } from '../../modules/kyc/kyc.service';

@Controller('admin/dashboard')
@UseGuards(AdminJwtGuard, AdminRolesGuard)
export class AdminDashboardController {
  private readonly logger = new Logger(AdminDashboardController.name);

  constructor(
    private readonly integrationService: IntegrationService,
    private readonly kycService: KycService,
  ) {}

  @Get('stats')
  async getDashboardStats() {
    this.logger.log('[AdminDashboard] Fetching aggregated stats');

    // 1. Fetch KYC Stats
    const kycStats = await this.kycService.getKYCStats();

    // 2. Fetch Recent Transactions to calculate volume for chart
    // Note: Fetching top 50 transactions to build a basic volume chart
    const txResponse = await this.integrationService.forwardToGateway<any>(
      'get',
      '/api/v1/transactions?page=0&size=100',
    );
    const transactions = Array.isArray(txResponse) ? txResponse : txResponse.content || [];

    // 3. Process Transaction Volume for Chart (Group by hour for the last 24h)
    const now = new Date();
    const chartData = this.processTransactionVolume(transactions);

    // 4. Calculate Growth Stats
    const totalKyc = kycStats.approvedToday + kycStats.rejectedToday;
    const approvalRate = totalKyc > 0 ? Math.round((kycStats.approvedToday / totalKyc) * 100) : 100;

    return {
      kyc: kycStats,
      chartData,
      growth: {
        approvalRate,
        volumeGoal: 65, // This could be dynamic based on historical averages
      },
    };
  }

  private processTransactionVolume(transactions: any[]) {
    // Basic grouping by hour for the chart
    const hoursMap: Record<string, number> = {};

    // Initialize last 7 hours to match mock behavior if no data
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600000);
      const label = `${String(d.getHours()).padStart(2, '0')}:00`;
      hoursMap[label] = 0;
    }

    transactions.forEach((tx) => {
      const date = new Date(tx.createdAt);
      const label = `${String(date.getHours()).padStart(2, '0')}:00`;
      if (hoursMap[label] !== undefined) {
        hoursMap[label]++;
      }
    });

    return Object.entries(hoursMap)
      .map(([time, volume]) => ({
        time,
        volume,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  }
}
