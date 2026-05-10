import { apiClient } from '@/lib/api-client';
import { WalletDto, AdminPaginatedResponse, API_PATHS } from '@repo/dto';

export const walletRequester = {
  getWallets: async (params?: { page?: number; size?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<AdminPaginatedResponse<WalletDto>>(
      `${API_PATHS.ADMIN.FINANCE.WALLETS}?${query}`,
    );
  },
  freezeWallet: async (userId: string) => {
    return apiClient.post<void>(
      API_PATHS.ADMIN.FINANCE.WALLET_FREEZE(userId),
      {},
    );
  },
  unfreezeWallet: async (userId: string) => {
    return apiClient.post<void>(
      API_PATHS.ADMIN.FINANCE.WALLET_UNFREEZE(userId),
      {},
    );
  },
  getWalletById: async (id: string) => {
    return apiClient.get<{ data: WalletDto }>(
      API_PATHS.ADMIN.FINANCE.WALLET_DETAIL(id),
    );
  },
};
