import { apiClient, RequestOptions } from '@/lib/api-client';
import { WalletUser, AdminUser, CreateAdminRequest, API_PATHS, AdminPaginatedResponse } from '@repo/dto';

export const userRequester = {
  getWalletUsers: async (options?: RequestOptions) => apiClient.get<AdminPaginatedResponse<WalletUser>>(API_PATHS.ADMIN.USERS.WALLET, options),
  getSecurityEvents: async (options?: RequestOptions) => apiClient.get<AdminPaginatedResponse<any>>(API_PATHS.ADMIN.USERS.SECURITY_EVENTS, options),
  getAdminUsers: async (options?: RequestOptions) => apiClient.get<AdminPaginatedResponse<AdminUser>>(API_PATHS.ADMIN.USERS.BASE, options),
  suspendWalletUser: async (id: string, options?: RequestOptions) => apiClient.post<void>(API_PATHS.ADMIN.USERS.SUSPEND(id), {}, options),
  unsuspendWalletUser: async (id: string, options?: RequestOptions) => apiClient.post<void>(API_PATHS.ADMIN.USERS.UNSUSPEND(id), {}, options),
  blockWalletUser: async (id: string, options?: RequestOptions) => apiClient.post<void>(API_PATHS.ADMIN.USERS.BLOCK(id), {}, options),
  unblockWalletUser: async (id: string, options?: RequestOptions) => apiClient.post<void>(API_PATHS.ADMIN.USERS.UNBLOCK(id), {}, options),
  createAdmin: async (data: CreateAdminRequest, options?: RequestOptions) => apiClient.post<AdminUser>(API_PATHS.ADMIN.USERS.BASE, data, options),
  deleteAdmin: async (id: string, options?: RequestOptions) => apiClient.delete<void>(`${API_PATHS.ADMIN.USERS.BASE}/${id}`, options),
};
