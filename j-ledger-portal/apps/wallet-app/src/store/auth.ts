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
  isAuthenticated: boolean;
  isLoading: boolean;
  user: WalletUser | null;
  biometricEnabled: boolean;
  setToken: (token: string | null) => Promise<void>;
  setUser: (user: WalletUser | null) => void;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
}

const isWeb = Platform.OS === 'web';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const PIN_HASH_KEY = 'pin_hash';

/**
 * Simple PIN verification (in production, use bcrypt or similar)
 * For now, we store a hash for basic verification
 */
const hashPin = (pin: string): string => {
  return Buffer.from(pin).toString('base64');
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isAuthenticated: false,
  isLoading: true,
  user: null,
  biometricEnabled: false,

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
    try {
      const state = get();
      if (!state.token) {
        console.warn('[Auth] No token to verify PIN against');
        return false;
      }

      // In production, this would be verified against backend
      // For now, we do client-side verification
      const pinHash = isWeb
        ? localStorage.getItem(PIN_HASH_KEY)
        : await SecureStore.getItemAsync(PIN_HASH_KEY);

      if (!pinHash) {
        console.warn('[Auth] No PIN set up');
        return false;
      }

      return pinHash === hashPin(pin);
    } catch (error) {
      console.error('[Auth] PIN verification error:', error);
      return false;
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = isWeb
        ? localStorage.getItem('auth_token')
        : await SecureStore.getItemAsync('auth_token');

      const biometricEnabled = isWeb
        ? localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true'
        : (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === 'true';

      if (token) {
        set({ token, isAuthenticated: true, biometricEnabled });
      } else {
        set({ biometricEnabled });
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
