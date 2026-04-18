import { apiClient } from '@/lib/api-client';
import { WalletUser, AdminUser } from '@/types/models';

export const userRequester = {
  getWalletUsers: async () => apiClient.get<WalletUser[]>('/api/admin/users/wallet'),
  getAdminUsers: async () => apiClient.get<AdminUser[]>('/api/admin/users'),
  freezeWalletUser: async (id: string) => apiClient.post(`/api/admin/users/${id}/freeze`),
  createAdmin: async (data: any) => apiClient.post('/api/admin/users', data),
  deleteAdmin: async (id: string) => apiClient.delete(`/api/admin/users/${id}`),
};
