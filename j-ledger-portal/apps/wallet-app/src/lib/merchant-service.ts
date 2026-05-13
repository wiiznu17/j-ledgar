import api from './axios';

export interface MerchantDashboardData {
  isMerchant: boolean;
  applicationStatus: string | null;
  message?: string;
  totalRevenue?: number;
  totalTransactions?: number;
  activeTerminals?: number;
  totalMerchantBalance?: number;
}

export interface MerchantTransaction {
  id: string;
  amount: number;
  status: string;
  type: string;
  createdAt: string;
  referenceId?: string;
}

export interface MerchantTerminal {
  id: string;
  name: string;
  status: string;
  hardwareId?: string;
  createdAt: string;
}

export const MerchantService = {
  getDashboard: async (): Promise<MerchantDashboardData> => {
    const response = await api.get('/merchant/dashboard');
    return response.data;
  },

  apply: async (data: { 
    businessName: string; 
    taxId: string;
    category: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    latitude?: string;
    longitude?: string;
    images?: string[];
  }): Promise<any> => {

    const response = await api.post('/merchant/apply', data);
    return response.data;
  },

  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: MerchantTransaction[]; pagination: any }> => {
    const response = await api.get('/merchant/transactions', { params });
    // Handle both plain array and paginated response just in case
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        pagination: { total: response.data.length, page: 1, limit: 10, totalPages: 1 },
      };
    }
    return response.data;
  },

  getTerminals: async (): Promise<MerchantTerminal[]> => {
    const response = await api.get('/merchant/terminals');
    return response.data;
  },
};

