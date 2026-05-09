import { API_PATHS } from '@repo/dto';
import { apiClient } from '../api-client';

export const kycRequester = {
  getStats: async () => {
    return apiClient.get<any>(API_PATHS.ADMIN.KYC.STATS);
  },
  
  getPendingList: async () => {
    return apiClient.get<any[]>(API_PATHS.ADMIN.KYC.PENDING);
  },
  
  getList: async (params: { 
    status?: string; 
    phoneNumber?: string; 
    startDate?: string; 
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    return apiClient.get<any>(API_PATHS.ADMIN.KYC.LIST, { params });
  },
  
  getDetails: async (userId: string) => {
    return apiClient.get<any>(API_PATHS.ADMIN.KYC.DETAILS(userId));
  },
  
  approve: async (userId: string) => {
    return apiClient.post<void>(API_PATHS.ADMIN.KYC.APPROVE(userId));
  },
  
  reject: async (userId: string, reason: string) => {
    return apiClient.post<void>(API_PATHS.ADMIN.KYC.REJECT(userId), { reason });
  },
  
  getHistory: async (userId: string) => {
    return apiClient.get<any[]>(API_PATHS.ADMIN.KYC.HISTORY(userId));
  }
};
