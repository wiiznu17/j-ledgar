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
  setPin: (pin: string) => Promise<void>;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
}

const isWeb = Platform.OS === 'web';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const PIN_HASH_KEY = 'pin_hash';

/**
 * Simple Base64 implementation for React Native (Buffer fallback)
 */
const hashPin = (pin: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let i = 0; i < pin.length; i += 3) {
    const a = pin.charCodeAt(i);
    const b = i + 1 < pin.length ? pin.charCodeAt(i + 1) : NaN;
    const c = i + 2 < pin.length ? pin.charCodeAt(i + 2) : NaN;

    output += chars[a >> 2];
    output += chars[((a & 3) << 4) | (isNaN(b) ? 0 : b >> 4)];
    output += isNaN(b) ? '=' : chars[((b & 15) << 2) | (isNaN(c) ? 0 : c >> 6)];
    output += isNaN(c) ? '=' : chars[c & 63];
  }
  return output;
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
      // In production, this would be verified against backend
      // For now, we do client-side verification
      const pinHash = isWeb
        ? localStorage.getItem(PIN_HASH_KEY)
        : await SecureStore.getItemAsync(PIN_HASH_KEY);

      if (!pinHash) {
        console.warn('[Auth] No PIN set up, defaulting to 111111 for development');
        return pin === '111111';
      }

      return pinHash === hashPin(pin);
    } catch (error) {
      console.error('[Auth] PIN verification error:', error);
      return false;
    }
  },

  setPin: async (pin: string) => {
    try {
      const pinHash = hashPin(pin);
      if (isWeb) {
        localStorage.setItem(PIN_HASH_KEY, pinHash);
      } else {
        await SecureStore.setItemAsync(PIN_HASH_KEY, pinHash);
      }
      console.log('[Auth] PIN set successfully');
    } catch (error) {
      console.error('[Auth] Failed to set PIN:', error);
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

      // Initialize default PIN hash (111111) if not set
      const pinHash = isWeb
        ? localStorage.getItem(PIN_HASH_KEY)
        : await SecureStore.getItemAsync(PIN_HASH_KEY);

      if (!pinHash) {
        const defaultPin = '111111';
        const defaultHash = hashPin(defaultPin);
        if (isWeb) {
          localStorage.setItem(PIN_HASH_KEY, defaultHash);
        } else {
          await SecureStore.setItemAsync(PIN_HASH_KEY, defaultHash);
        }
        console.log('[Auth] Initialized default PIN: 111111');
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
