import { apiClient, RequestOptions } from '@/lib/api-client';
import {
  Transaction,
  TransactionDetailsDto,
  TransferRequest,
  AdminPaginatedResponse,
  API_PATHS,
} from '@repo/dto';

export const transactionRequester = {
  getHistory: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get<AdminPaginatedResponse<Transaction>>(
      `${API_PATHS.ADMIN.TRANSACTIONS.BASE}?${query}`,
    );
  },
  getDetails: async (id: string) =>
    apiClient.get<TransactionDetailsDto>(
      API_PATHS.ADMIN.TRANSACTIONS.DETAILS(id),
    ),
  transfer: async (data: TransferRequest, options?: RequestOptions) =>
    apiClient.post<Transaction>(
      API_PATHS.ADMIN.TRANSACTIONS.TRANSFER,
      data,
      options,
    ),
};
