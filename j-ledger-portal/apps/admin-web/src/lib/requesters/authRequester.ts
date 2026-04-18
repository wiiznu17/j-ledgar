import { apiClient, RequestOptions } from '@/lib/api-client';
import { LoginRequest, AuthResponse, RefreshTokenRequest, API_PATHS } from '@repo/dto';

export const authRequester = {
  login: async (data: LoginRequest, options?: RequestOptions) => apiClient.post<AuthResponse>(API_PATHS.ADMIN.AUTH.LOGIN, data, options),
  logout: async (options?: RequestOptions) => apiClient.post<void>(API_PATHS.ADMIN.AUTH.LOGOUT, {}, options),
  refresh: async (data: RefreshTokenRequest, options?: RequestOptions) => apiClient.post<AuthResponse>(API_PATHS.ADMIN.AUTH.REFRESH, data, options),
};
