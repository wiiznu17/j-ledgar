import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { WalletUser } from '@repo/dto';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: WalletUser | null;
  setToken: (token: string | null) => Promise<void>;
  setUser: (user: WalletUser | null) => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
}

const isWeb = Platform.OS === 'web';

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  isLoading: true,
  user: null,

  setToken: async (token: string | null) => {
    if (token) {
      if (isWeb) {
        localStorage.setItem('auth_token', token);
      } else {
        await SecureStore.setItemAsync('auth_token', token);
      }
      set({ token, isAuthenticated: true });
    } else {
      if (isWeb) {
        localStorage.removeItem('auth_token');
      } else {
        await SecureStore.deleteItemAsync('auth_token');
      }
      set({ token: null, isAuthenticated: false });
    }
  },

  setUser: (user: WalletUser | null) => set({ user }),

  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = isWeb
        ? localStorage.getItem('auth_token')
        : await SecureStore.getItemAsync('auth_token');

      if (token) {
        set({ token, isAuthenticated: true });
      }
    } catch (e) {
      console.error('Failed to initialize auth store', e);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    if (isWeb) {
      localStorage.removeItem('auth_token');
    } else {
      await SecureStore.deleteItemAsync('auth_token');
    }
    set({ token: null, isAuthenticated: false, user: null });
  },
}));
