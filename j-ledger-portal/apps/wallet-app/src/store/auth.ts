import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface WalletUser {
  id: string;
  email?: string;
  phoneNumber?: string;
  createdAt?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  user: WalletUser | null;
  biometricEnabled: boolean;
  setToken: (token: string | null, refreshToken?: string | null) => Promise<void>;
  setUser: (user: WalletUser | null) => void;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
}

const isWeb = Platform.OS === 'web';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  user: null,
  biometricEnabled: false,

  setToken: async (token: string | null, refreshToken?: string | null) => {
    if (token) {
      if (isWeb) {
        localStorage.setItem('auth_token', token);
        if (refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
      } else {
        await SecureStore.setItemAsync('auth_token', token);
        if (refreshToken) {
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
        }
      }
      set({ token, refreshToken: refreshToken || null, isAuthenticated: true });
    } else {
      if (isWeb) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      } else {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      }
      console.log('[Auth] Token cleared (Logged out)');
      set({ token: null, refreshToken: null, isAuthenticated: false });
    }
  },

  setUser: (user: WalletUser | null) => set({ user }),

  setBiometricEnabled: async (enabled: boolean) => {
    try {
      if (isWeb) {
        localStorage.setItem(BIOMETRIC_ENABLED_KEY, String(enabled));
      } else {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, String(enabled));
      }
      set({ biometricEnabled: enabled });
    } catch (error) {
      console.error('[Auth] Failed to set biometric enabled:', error);
    }
  },

  verifyPin: async (pin: string): Promise<boolean> => {
    const { token } = get();
    if (!token) return false;

    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';
      await require('axios').post(
        `${API_URL}/auth/pin/verify`,
        { pin },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return true;
    } catch (error: any) {
      console.error('[Auth] PIN verification failed:', error.response?.data || error.message);
      return false;
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = isWeb
        ? localStorage.getItem('auth_token')
        : await SecureStore.getItemAsync('auth_token');

      const refreshToken = isWeb
        ? localStorage.getItem(REFRESH_TOKEN_KEY)
        : await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

      const biometricEnabled = isWeb
        ? localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true'
        : (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === 'true';

      if (token) {
        console.log('[Auth] Restored session from storage');
        set({ token, refreshToken, isAuthenticated: true, biometricEnabled });
      } else {
        console.log('[Auth] No existing session found');
        set({ biometricEnabled });
      }

      // PIN will be initialized during onboarding flow
    } catch (e) {
      console.error('Failed to initialize auth store', e);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      // Import the store dynamically to avoid circular dependencies if any
      const { useRegistrationStore } = require('./registration');
      await useRegistrationStore.getState().reset();
    } catch (err) {
      console.warn('[Auth] Soft error resetting registration store on logout:', err);
    }

    if (isWeb) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    }
    set({ token: null, refreshToken: null, isAuthenticated: false, user: null });
  },
}));
