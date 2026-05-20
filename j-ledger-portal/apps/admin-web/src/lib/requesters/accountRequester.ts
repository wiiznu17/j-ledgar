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
    apiClient.put<void>(
      API_PATHS.ADMIN.ACCOUNTS.STATUS(id),
      { status },
      options,
    ),
  getAccountByUserId: async (userId: string, options?: RequestOptions) =>
    apiClient.get<{ data: Account | null }>(
      API_PATHS.ADMIN.ACCOUNTS.BY_USER(userId),
      options,
    ),
  getAccountById: async (id: string, options?: RequestOptions) =>
    apiClient.get<{ data: Account }>(
      `${API_PATHS.ADMIN.ACCOUNTS.BASE}/${id}`,
      options,
    ),
  getLedgerEntries: async (
    id: string,
    params?: any,
    options?: RequestOptions,
  ) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get<AdminPaginatedResponse<any>>(
      `${API_PATHS.ADMIN.ACCOUNTS.BASE}/${id}/ledger-entries?${query}`,
      options,
    );
  },
};
