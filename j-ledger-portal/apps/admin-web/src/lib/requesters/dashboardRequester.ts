import { API_PATHS } from '@repo/dto';
import { apiClient } from '../api-client';

export interface DashboardStats {
  kyc: {
    pending: number;
    approvedToday: number;
    rejectedToday: number;
  };
  chartData: Array<{ time: string; volume: number }>;
  financial: {
    totalRevenue: number;
    totalVatPayable: number;
    totalSystemBalance: number;
  };
  distribution: Array<{ name: string; value: number }>;
  growth: {
    approvalRate: number;
    volumeGoal: number;
  };
  totalActiveUsers?: number;
}

export const dashboardRequester = {
  getStats: async (query?: { from?: string; to?: string }) => {
    const params = new URLSearchParams();
    if (query?.from) params.append('from', query.from);
    if (query?.to) params.append('to', query.to);
    const suffix = params.toString() ? `?${params.toString()}` : '';

    return apiClient.get<DashboardStats>(`${API_PATHS.ADMIN.DASHBOARD.STATS}${suffix}`);
  },
};
