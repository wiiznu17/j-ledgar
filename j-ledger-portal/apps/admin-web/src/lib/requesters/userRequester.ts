import { apiClient, RequestOptions } from '@/lib/api-client';
import { WalletUser, AdminUser, CreateAdminRequest, API_PATHS, AdminPaginatedResponse } from '@repo/dto';

export const userRequester = {
  getWalletUsers: async (options?: RequestOptions) => apiClient.get<AdminPaginatedResponse<WalletUser>>(API_PATHS.ADMIN.USERS.WALLET, options),
  getSecurityEvents: async (options?: RequestOptions) => apiClient.get<AdminPaginatedResponse<any>>(API_PATHS.ADMIN.USERS.SECURITY_EVENTS, options),
  getAdminUsers: async (options?: RequestOptions) => apiClient.get<AdminPaginatedResponse<AdminUser>>('/api/admin/staff', options),
  suspendWalletUser: async (id: string, options?: RequestOptions) => apiClient.post<void>(API_PATHS.ADMIN.USERS.SUSPEND(id), {}, options),
  unsuspendWalletUser: async (id: string, options?: RequestOptions) => apiClient.post<void>(API_PATHS.ADMIN.USERS.UNSUSPEND(id), {}, options),
  blockWalletUser: async (id: string, options?: RequestOptions) => apiClient.post<void>(API_PATHS.ADMIN.USERS.BLOCK(id), {}, options),
  unblockWalletUser: async (id: string, options?: RequestOptions) => apiClient.post<void>(API_PATHS.ADMIN.USERS.UNBLOCK(id), {}, options),
  createAdmin: async (data: any, options?: RequestOptions) => apiClient.post<AdminUser>('/api/admin/staff', data, options),
  deleteAdmin: async (id: string, options?: RequestOptions) => apiClient.delete<void>(`/api/admin/staff/${id}`, options),
  getAdminDetail: async (id: string, options?: RequestOptions) => apiClient.get<AdminUser>(`/api/admin/staff/${id}`, options),
  resetAdminPassword: async (id: string, options?: RequestOptions) => apiClient.post<void>(`/api/admin/staff/${id}/reset-password`, {}, options),
  resendAdminInvite: async (id: string, options?: RequestOptions) => apiClient.post<void>(`/api/admin/staff/${id}/resend-invite`, {}, options),
  getUserDetail: async (id: string) => apiClient.get<WalletUser>(`/api/admin/users/${id}`),
  getUserActivity: async (id: string) => apiClient.get<any>(`/admin/users/${id}/activity`),
  getUserAccount: async (userId: string) => apiClient.get<any>(`/admin/accounts/user/${userId}`),
};
