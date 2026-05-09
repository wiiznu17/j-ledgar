import { apiClient, RequestOptions } from '@/lib/api-client';
import { Account, AdminPaginatedResponse, API_PATHS } from '@repo/dto';

export const accountRequester = {
  getAccounts: async (params?: any, options?: RequestOptions) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get<AdminPaginatedResponse<Account>>(
      `${API_PATHS.ADMIN.ACCOUNTS.BASE}?${query}`,
      options,
    );
  },
  updateStatus: async (id: string, status: string, options?: RequestOptions) =>
    apiClient.put<void>(API_PATHS.ADMIN.ACCOUNTS.STATUS(id), { status }, options),
};
