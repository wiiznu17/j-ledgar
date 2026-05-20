import { apiClient, RequestOptions } from '@/lib/api-client';
import {
  WalletUser,
  AdminUser,
  CreateAdminRequest,
  API_PATHS,
  AdminPaginatedResponse,
} from '@repo/dto';

export const userRequester = {
  getWalletUsers: async (options?: RequestOptions) =>
    apiClient.get<AdminPaginatedResponse<WalletUser>>(
      API_PATHS.ADMIN.USERS.WALLET,
      options,
    ),
  getWalletUserStats: async (options?: RequestOptions) =>
    apiClient.get<any>(API_PATHS.ADMIN.USERS.WALLET_STATS, options),
  getSecurityEvents: async (options?: RequestOptions) =>
    apiClient.get<AdminPaginatedResponse<any>>(
      API_PATHS.ADMIN.USERS.SECURITY_EVENTS,
      options,
    ),
  getAdminUsers: async (options?: RequestOptions) =>
    apiClient.get<AdminPaginatedResponse<AdminUser>>(
      API_PATHS.ADMIN.STAFF.BASE,
      options,
    ),
  suspendWalletUser: async (id: string, options?: RequestOptions) =>
    apiClient.post<void>(API_PATHS.ADMIN.USERS.SUSPEND(id), {}, options),
  unsuspendWalletUser: async (id: string, options?: RequestOptions) =>
    apiClient.post<void>(API_PATHS.ADMIN.USERS.UNSUSPEND(id), {}, options),
  blockWalletUser: async (id: string, options?: RequestOptions) =>
    apiClient.post<void>(API_PATHS.ADMIN.USERS.BLOCK(id), {}, options),
  unblockWalletUser: async (id: string, options?: RequestOptions) =>
    apiClient.post<void>(API_PATHS.ADMIN.USERS.UNBLOCK(id), {}, options),
  createAdmin: async (data: any, options?: RequestOptions) =>
    apiClient.post<AdminUser>(API_PATHS.ADMIN.STAFF.BASE, data, options),
  deleteAdmin: async (id: string, options?: RequestOptions) =>
    apiClient.delete<void>(API_PATHS.ADMIN.STAFF.DETAIL(id), options),
  getAdminDetail: async (id: string, options?: RequestOptions) =>
    apiClient.get<AdminUser>(API_PATHS.ADMIN.STAFF.DETAIL(id), options),
  updateAdmin: async (id: string, data: any, options?: RequestOptions) =>
    apiClient.put<AdminUser>(API_PATHS.ADMIN.STAFF.DETAIL(id), data, options),
  deactivateAdmin: async (id: string, options?: RequestOptions) =>
    apiClient.post<void>(API_PATHS.ADMIN.STAFF.DEACTIVATE(id), {}, options),
  reactivateAdmin: async (id: string, options?: RequestOptions) =>
    apiClient.post<void>(API_PATHS.ADMIN.STAFF.REACTIVATE(id), {}, options),
  resetAdminPassword: async (id: string, options?: RequestOptions) =>
    apiClient.post<void>(API_PATHS.ADMIN.STAFF.RESET_PASSWORD(id), {}, options),
  resendAdminInvite: async (id: string, options?: RequestOptions) =>
    apiClient.post<void>(API_PATHS.ADMIN.STAFF.RESEND_INVITE(id), {}, options),

  getUserDetail: async (id: string) =>
    apiClient.get<{ data: WalletUser }>(API_PATHS.ADMIN.USERS.DETAIL(id)),
  getUserActivity: async (id: string) =>
    apiClient.get<any>(API_PATHS.ADMIN.USERS.ACTIVITY(id)),
  getUserAccount: async (userId: string) =>
    apiClient.get<any>(API_PATHS.ADMIN.ACCOUNTS.BY_USER(userId)),
  getUserWallet: async (userId: string) =>
    apiClient.get<any>(`/api/admin/wallets/user/${userId}`),

  // Roles & Permissions
  getAllRoles: async (options?: RequestOptions) =>
    apiClient.get<AdminPaginatedResponse<any>>(
      API_PATHS.ADMIN.ROLES.BASE,
      options,
    ),
  getRoleDetail: async (id: string) =>
    apiClient.get<any>(API_PATHS.ADMIN.ROLES.DETAIL(id)),
  createRole: async (data: any) =>
    apiClient.post<any>(API_PATHS.ADMIN.ROLES.BASE, data),
  updateRole: async (id: string, data: any) =>
    apiClient.put<any>(API_PATHS.ADMIN.ROLES.DETAIL(id), data),
  getAllPermissions: async () =>
    apiClient.get<any[]>(API_PATHS.ADMIN.PERMISSIONS.BASE),
  syncRolePermissions: async (roleId: string, permissionIds: string[]) =>
    apiClient.put<any>(API_PATHS.ADMIN.ROLES.PERMISSIONS(roleId), {
      permissionIds,
    }),
};
