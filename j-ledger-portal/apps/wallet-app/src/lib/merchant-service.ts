import api from './axios';

export interface MerchantDashboardData {
  isMerchant: boolean;
  merchantId?: string;
  applicationStatus: string | null;
  rejectionReason?: string;
  message?: string;
  totalRevenue?: number;
  totalTransactions?: number;
  activeTerminals?: number;
  totalMerchantBalance?: number;
  profile?: {
    name: string;
    businessNameEn?: string;
    category?: string;
    logoUrl?: string;
  };
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

  // ==================== Merchant Payments (QR) ====================

  generatePaymentQR: async (merchantId: string, amount: number): Promise<any> => {
    const response = await api.post('/merchant/payments/qr', { merchantId, amount });
    return response.data;
  },

  getStaticQR: async (merchantId: string): Promise<any> => {
    const response = await api.get('/merchant/payments/static-qr', { params: { merchantId } });
    return response.data;
  },

  getPaymentDetail: async (paymentId: string): Promise<any> => {
    const response = await api.get(`/merchant/payments/${paymentId}`);
    return response.data;
  },

  confirmPayment: async (paymentId: string): Promise<any> => {
    const response = await api.post(`/merchant/payments/${paymentId}/confirm`);
    return response.data;
  },

  previewManualPayment: async (merchantId: string): Promise<any> => {
    const response = await api.get('/merchant/manual-pay/preview', { params: { merchantId } });
    return response.data;
  },

  confirmManualPayment: async (data: { merchantId: string; amount: number; note?: string }): Promise<any> => {
    const response = await api.post('/merchant/manual-pay/confirm', data);
    return response.data;
  },
};

