import { apiClient } from '@/lib/api-client';
import { WalletDto, AdminPaginatedResponse } from '@repo/dto';

export const walletRequester = {
  getWallets: async (params?: { page?: number; size?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<AdminPaginatedResponse<WalletDto>>(`/api/admin/wallets?${query}`);
  },
  freezeWallet: async (userId: string) => {
    return apiClient.post<void>(`/api/admin/wallets/${userId}/freeze`, {});
  },
  unfreezeWallet: async (userId: string) => {
    return apiClient.post<void>(`/api/admin/wallets/${userId}/unfreeze`, {});
  }
};
