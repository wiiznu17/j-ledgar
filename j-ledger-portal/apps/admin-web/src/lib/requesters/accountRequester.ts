import { apiClient, RequestOptions } from '@/lib/api-client';
import { Account, PaginatedResponse, API_PATHS } from '@repo/dto';

export const accountRequester = {
  getAccounts: async (page = 0, size = 50, options?: RequestOptions) =>
    apiClient.get<PaginatedResponse<Account>>(`${API_PATHS.ADMIN.ACCOUNTS.BASE}?page=${page}&size=${size}`, options),
  updateStatus: async (id: string, status: string, options?: RequestOptions) =>
    apiClient.put<void>(API_PATHS.ADMIN.ACCOUNTS.STATUS(id), { status }, options),
};
