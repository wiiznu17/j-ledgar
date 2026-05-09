import { apiClient, RequestOptions } from '@/lib/api-client';
import { LoginRequest, AuthResponse, RefreshTokenRequest, AdminUser, API_PATHS } from '@repo/dto';

export const authRequester = {
  login: async (data: LoginRequest) => apiClient.post<AuthResponse>(API_PATHS.ADMIN.AUTH.LOGIN, data),
  refresh: async (data: RefreshTokenRequest) => apiClient.post<AuthResponse>(API_PATHS.ADMIN.AUTH.REFRESH, data),
  logout: async () => apiClient.post<void>(API_PATHS.ADMIN.AUTH.LOGOUT, {}),
  
  validateResetToken: async (token: string) => 
    apiClient.post<{ valid: boolean }>(API_PATHS.ADMIN.AUTH.RESET_PASSWORD_VALIDATE, { token }),
    
  confirmPasswordReset: async (data: { token: string; password: string }) => 
    apiClient.post<{ success: boolean }>(API_PATHS.ADMIN.AUTH.RESET_PASSWORD_CONFIRM, data),

  validateInviteToken: async (token: string) => 
    apiClient.post<{ valid: boolean }>(API_PATHS.ADMIN.AUTH.ACTIVATE_VALIDATE, { token }),
    
  activateAccount: async (data: { token: string; password: string }) => 
    apiClient.post<{ success: boolean }>(API_PATHS.ADMIN.AUTH.ACTIVATE_CONFIRM, data),

  getMe: async () => apiClient.get<AdminUser>(API_PATHS.ADMIN.AUTH.ME),
  updateMe: async (data: { firstName?: string; lastName?: string }) => 
    apiClient.put<AdminUser>(API_PATHS.ADMIN.AUTH.ME, data),
};
