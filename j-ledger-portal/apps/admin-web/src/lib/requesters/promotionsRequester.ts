import { apiClient, RequestOptions } from '@/lib/api-client';
import { API_PATHS } from '@repo/dto';

export const promotionsRequester = {
  // Deals
  getDeals: async (options?: RequestOptions) =>
    apiClient.get<any[]>(API_PATHS.ADMIN.PROMOTIONS.DEALS, options),
  getDeal: async (id: string, options?: RequestOptions) =>
    apiClient.get<any>(API_PATHS.ADMIN.PROMOTIONS.DEAL_DETAIL(id), options),
  createDeal: async (data: any, options?: RequestOptions) =>
    apiClient.post<any>(API_PATHS.ADMIN.PROMOTIONS.DEALS, data, options),
  updateDeal: async (id: string, data: any, options?: RequestOptions) =>
    apiClient.put<any>(
      API_PATHS.ADMIN.PROMOTIONS.DEAL_DETAIL(id),
      data,
      options,
    ),
  deleteDeal: async (id: string, options?: RequestOptions) =>
    apiClient.delete<void>(API_PATHS.ADMIN.PROMOTIONS.DEAL_DETAIL(id), options),

  // Banners
  getBanners: async (options?: RequestOptions) =>
    apiClient.get<any[]>(API_PATHS.ADMIN.PROMOTIONS.BANNERS, options),
  getBanner: async (id: string, options?: RequestOptions) =>
    apiClient.get<any>(API_PATHS.ADMIN.PROMOTIONS.BANNER_DETAIL(id), options),
  createBanner: async (data: any, options?: RequestOptions) =>
    apiClient.post<any>(API_PATHS.ADMIN.PROMOTIONS.BANNERS, data, options),
  updateBanner: async (id: string, data: any, options?: RequestOptions) =>
    apiClient.put<any>(
      API_PATHS.ADMIN.PROMOTIONS.BANNER_DETAIL(id),
      data,
      options,
    ),
  deleteBanner: async (id: string, options?: RequestOptions) =>
    apiClient.delete<void>(
      API_PATHS.ADMIN.PROMOTIONS.BANNER_DETAIL(id),
      options,
    ),

  // Redemptions
  getRedemptions: async (options?: RequestOptions) =>
    apiClient.get<any[]>(API_PATHS.ADMIN.PROMOTIONS.REDEMPTIONS, options),

  // Meta
  getBrands: async (options?: RequestOptions) =>
    apiClient.get<any[]>(API_PATHS.ADMIN.PROMOTIONS.BRANDS, options),
  getCategories: async (options?: RequestOptions) =>
    apiClient.get<any[]>(API_PATHS.ADMIN.PROMOTIONS.CATEGORIES, options),

  // Common
  uploadFile: async (file: File, options?: RequestOptions) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<any>(API_PATHS.ADMIN.PROMOTIONS.UPLOAD, formData, {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
