import { apiClient } from '@/lib/api-client';

export const authRequester = {
  login: async (data: any) => apiClient.post('/api/admin/auth/login', data),
  logout: async () => apiClient.post('/api/admin/auth/logout'),
  refresh: async (data: any) => apiClient.post('/api/admin/auth/refresh', data),
};
