import { apiClient, RequestOptions } from '@/lib/api-client';
import { API_PATHS, TreasurySummary, TreasuryPayout } from '@repo/dto';

export const treasuryRequester = {
  getSummary: async (options?: RequestOptions) =>
    apiClient.get<TreasurySummary>(API_PATHS.ADMIN.FINANCE.TREASURY_SUMMARY, options),
  getPayoutHistory: async (options?: RequestOptions) =>
    apiClient.get<TreasuryPayout[]>(API_PATHS.ADMIN.FINANCE.TREASURY_PAYOUTS, options),
  triggerPayout: async (amount: number, options?: RequestOptions) =>
    apiClient.post<{ success: boolean; payoutId: string }>(
      API_PATHS.ADMIN.FINANCE.TREASURY_PAYOUT_TRIGGER,
      { amount },
      options
    ),
};
