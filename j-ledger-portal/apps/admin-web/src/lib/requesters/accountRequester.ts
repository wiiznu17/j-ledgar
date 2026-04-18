import { apiClient } from '@/lib/api-client';
import { Account } from '@/types/models';

export const accountRequester = {
  getAccounts: async (page = 0, size = 50) => 
    apiClient.get<any>(`/api/admin/accounts?page=${page}&size=${size}`),
  updateStatus: async (id: string, status: string) =>
    apiClient.put(`/api/admin/accounts/${id}/status`, { status }),
};
