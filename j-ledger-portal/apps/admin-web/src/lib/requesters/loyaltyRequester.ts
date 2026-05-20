import { apiClient } from '@/lib/api-client';
import { API_PATHS } from '@repo/dto';

export const loyaltyRequester = {
  getRules: async () => apiClient.get<any[]>(API_PATHS.ADMIN.LOYALTY.RULES),

  updateRule: async (eventType: string, data: any) =>
    apiClient.put<any>(API_PATHS.ADMIN.LOYALTY.RULE_DETAIL(eventType), data),

  getStats: async () => apiClient.get<any>(API_PATHS.ADMIN.LOYALTY.STATS),

  getExpirySchedule: async () =>
    apiClient.get<any[]>(API_PATHS.ADMIN.LOYALTY.EXPIRY_SCHEDULE),
};
