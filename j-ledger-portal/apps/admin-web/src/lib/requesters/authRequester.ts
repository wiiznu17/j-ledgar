import { apiClient, RequestOptions } from '@/lib/api-client';
import { LoginRequest, AuthResponse, RefreshTokenRequest } from '@repo/dto';

export const authRequester = {
  login: async (data: LoginRequest) => apiClient.post<AuthResponse>('/api/admin/auth/login', data),
  refresh: async (data: RefreshTokenRequest) => apiClient.post<AuthResponse>('/api/admin/auth/refresh', data),
  logout: async () => apiClient.post<void>('/api/admin/auth/logout', {}),
  
  validateResetToken: async (token: string) => 
    apiClient.post<{ valid: boolean }>('/api/admin/auth/reset-password/validate', { token }),
    
  confirmPasswordReset: async (data: { token: string; password: string }) => 
    apiClient.post<{ success: boolean }>('/api/admin/auth/reset-password/confirm', data),

  validateInviteToken: async (token: string) => 
    apiClient.post<{ valid: boolean }>('/api/admin/auth/activate/validate', { token }),
    
  activateAccount: async (data: { token: string; password: string }) => 
    apiClient.post<{ success: boolean }>('/api/admin/auth/activate/confirm', data),
};
