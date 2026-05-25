import { create } from 'zustand';

interface MerchantState {
  isMerchant: boolean;
  isApplying: boolean;
  setIsMerchant: (isMerchant: boolean) => void;
  setIsApplying: (isApplying: boolean) => void;
}

export const useMerchantStore = create<MerchantState>((set) => ({
  isMerchant: false,
  isApplying: false,
  setIsMerchant: (isMerchant) => set({ isMerchant }),
  setIsApplying: (isApplying) => set({ isApplying }),
}));
