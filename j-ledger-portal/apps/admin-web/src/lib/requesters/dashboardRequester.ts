import { API_PATHS } from '@repo/dto';
import { apiClient } from '../api-client';

export interface DashboardStats {
  kyc: {
    pending: number;
    approvedToday: number;
    rejectedToday: number;
  };
  chartData: Array<{ time: string; volume: number }>;
  growth: {
    approvalRate: number;
    volumeGoal: number;
  };
  totalActiveUsers?: number;
}

export const dashboardRequester = {
  getStats: async () => {
    return apiClient.get<DashboardStats>(API_PATHS.ADMIN.DASHBOARD.STATS);
  },
};
