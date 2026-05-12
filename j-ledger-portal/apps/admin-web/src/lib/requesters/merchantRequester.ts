import { API_PATHS } from '@repo/dto';
import { apiClient } from '../api-client';

export const merchantRequester = {
  // Partner Management
  getPartners: async (params: { page?: number; limit?: number; search?: string; status?: string }) => {
    return apiClient.get<any>(API_PATHS.ADMIN.MERCHANT.PARTNERS, { params });
  },

  getPartnerDetail: async (id: string) => {
    return apiClient.get<any>(API_PATHS.ADMIN.MERCHANT.PARTNER_DETAIL(id));
  },

  updatePartnerStatus: async (id: string, status: boolean) => {
    return apiClient.put<void>(API_PATHS.ADMIN.MERCHANT.PARTNER_STATUS(id), { status });
  },

  // Application Management
  getApplications: async (params: { page?: number; limit?: number; status?: string }) => {
    return apiClient.get<any>(API_PATHS.ADMIN.MERCHANT.APPLICATIONS, { params });
  },

  reviewApplication: async (id: string, data: { status: string; note?: string }) => {
    return apiClient.put<void>(API_PATHS.ADMIN.MERCHANT.APPLICATION_REVIEW(id), data);
  },

  getPartnerMerchants: async (partnerId: string) => {
    return apiClient.get<any[]>(`${API_PATHS.ADMIN.MERCHANT.PARTNERS}/${partnerId}/merchants`);
  },

  // Terminal Management
  getTerminals: async (merchantId: string) => {
    return apiClient.get<any[]>(API_PATHS.ADMIN.MERCHANT.TERMINALS(merchantId));
  },

  createTerminal: async (merchantId: string, data: { name: string; hardwareId?: string }) => {
    return apiClient.post<any>(API_PATHS.ADMIN.MERCHANT.TERMINALS(merchantId), data);
  },
};
