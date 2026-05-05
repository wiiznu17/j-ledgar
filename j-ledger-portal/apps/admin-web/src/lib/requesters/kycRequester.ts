import { apiClient } from '../api-client';

export const kycRequester = {
  getStats: async () => {
    return apiClient.get('/admin/kyc/stats');
  },
  
  getPendingList: async () => {
    return apiClient.get('/admin/kyc/pending');
  },
  
  getList: async (params: { 
    status?: string; 
    phoneNumber?: string; 
    startDate?: string; 
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    return apiClient.get('/admin/kyc/list', { params });
  },
  
  getDetails: async (userId: string) => {
    return apiClient.get(`/admin/kyc/details/${userId}`);
  },
  
  approve: async (userId: string) => {
    return apiClient.post(`/admin/kyc/approve/${userId}`);
  },
  
  reject: async (userId: string, reason: string) => {
    return apiClient.post(`/admin/kyc/reject/${userId}`, { reason });
  },
  
  getHistory: async (userId: string) => {
    return apiClient.get(`/admin/kyc/history/${userId}`);
  }
};
