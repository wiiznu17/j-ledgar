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
    try {
      const res = await apiClient.get<AdminPaginatedResponse<Transaction>>(
        `${API_PATHS.ADMIN.TRANSACTIONS.BASE}?${query}`,
      );
      console.log('[TRANSACTION_REQUESTER] Get history response:', res);
      return res;
    } catch (error) {
      console.error('[TRANSACTION_REQUESTER] Get history error:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    }
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
