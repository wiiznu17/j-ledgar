import { apiClient } from '@/lib/api-client';
import { TransactionDetailsDto } from '@/types/models';

export const transactionRequester = {
  getHistory: async (page = 0, size = 20) =>
    apiClient.get<any>(`/api/admin/transactions?page=${page}&size=${size}`),
  getDetails: async (id: string) =>
    apiClient.get<TransactionDetailsDto>(`/api/admin/transactions/${id}`),
  transfer: async (data: any, options?: any) =>
    apiClient.post('/api/admin/transactions/transfer', data, options),
};
