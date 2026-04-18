import { apiClient, RequestOptions } from '@/lib/api-client';
import { WalletUser, AdminUser, CreateAdminRequest, API_PATHS } from '@repo/dto';

export const userRequester = {
  getWalletUsers: async (options?: RequestOptions) => apiClient.get<WalletUser[]>(API_PATHS.ADMIN.USERS.WALLET, options),
  getAdminUsers: async (options?: RequestOptions) => apiClient.get<AdminUser[]>(API_PATHS.ADMIN.USERS.BASE, options),
  freezeWalletUser: async (id: string, options?: RequestOptions) => apiClient.post<void>(API_PATHS.ADMIN.USERS.FREEZE(id), {}, options),
  createAdmin: async (data: CreateAdminRequest, options?: RequestOptions) => apiClient.post<AdminUser>(API_PATHS.ADMIN.USERS.BASE, data, options),
  deleteAdmin: async (id: string, options?: RequestOptions) => apiClient.delete<void>(`${API_PATHS.ADMIN.USERS.BASE}/${id}`, options),
};
