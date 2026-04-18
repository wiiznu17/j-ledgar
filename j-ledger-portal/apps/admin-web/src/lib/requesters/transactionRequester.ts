import { apiClient, RequestOptions } from '@/lib/api-client';
import { Transaction, TransactionDetailsDto, TransferRequest, PaginatedResponse, API_PATHS } from '@repo/dto';

export const transactionRequester = {
  getHistory: async (page = 0, size = 20) =>
    apiClient.get<PaginatedResponse<Transaction>>(`${API_PATHS.ADMIN.TRANSACTIONS.BASE}?page=${page}&size=${size}`),
  getDetails: async (id: string) =>
    apiClient.get<TransactionDetailsDto>(API_PATHS.ADMIN.TRANSACTIONS.DETAILS(id)),
  transfer: async (data: TransferRequest, options?: RequestOptions) =>
    apiClient.post<Transaction>(API_PATHS.ADMIN.TRANSACTIONS.TRANSFER, data, options),
};
