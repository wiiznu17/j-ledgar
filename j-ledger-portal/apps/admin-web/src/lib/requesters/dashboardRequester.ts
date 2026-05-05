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
}

export const dashboardRequester = {
  getAggregatedStats: async () => {
    return apiClient.get<DashboardStats>('/admin/dashboard/stats');
  }
};
