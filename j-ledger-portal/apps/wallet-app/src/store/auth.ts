import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { verifySecureStorage } from '@/lib/device.utils';
import { api } from '@/lib/axios';

interface WalletUser {
  id: string;
  email?: string;
  phoneNumber?: string;
  status?: string;
  registrationState?: string;
  createdAt?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSession: boolean; // true when refresh token exists (user has logged in before on this device)
  needsPinVerification: boolean; // true when session exists but needs PIN to unlock
  user: WalletUser | null;
  biometricEnabled: boolean;
  lastActiveAt: number; // timestamp of last activity
  setToken: (token: string | null, refreshToken?: string | null) => Promise<void>;
  setUser: (user: WalletUser | null) => void;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  lockSession: () => void;
  updateActivity: () => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
}

const isWeb = Platform.OS === 'web';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const REFRESH_TOKEN_KEY = 'refresh_token';
const LAST_ACTIVE_KEY = 'last_active_at';

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  hasSession: false,
  needsPinVerification: false,
  user: null,
  biometricEnabled: false,
  lastActiveAt: Date.now(),

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
      set({ token, refreshToken: refreshToken || null, isAuthenticated: true, lastActiveAt: Date.now() });
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

  setUser: async (user: WalletUser | null) => {
    if (user) {
      if (isWeb) {
        localStorage.setItem('wallet_user', JSON.stringify(user));
      } else {
        await SecureStore.setItemAsync('wallet_user', JSON.stringify(user));
      }
    } else {
      if (isWeb) {
        localStorage.removeItem('wallet_user');
      } else {
        await SecureStore.deleteItemAsync('wallet_user');
      }
    }
    set({ user, lastActiveAt: Date.now() });
  },

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
    // Note: We don't need a token if we're using PIN to unlock/refresh
    // But currently backend JwtAuthGuard is blocking it.
    // We'll pass the token if we have it, or use deviceId in the future.
    try {
      const { user } = get();
      const deviceId = await require('@/lib/device.utils').getStableDeviceId();
      const deviceName = require('@/lib/device.utils').getDeviceName();

      const res = await api.post('/identity/pin/verify', { 
        pin,
        deviceId,
        deviceName
      });

      // If backend returns new tokens on PIN verify, use them!
      if (res.data.accessToken) {
        await get().setToken(res.data.accessToken, res.data.refreshToken);
      }
      
      return true;
    } catch (error: any) {
      console.error('[Auth] PIN verification failed:', error.response?.data || error.message);
      return false;
    }
  },

  refreshSession: async (): Promise<boolean> => {
    const { refreshToken } = get();
    if (!refreshToken) return false;

    try {
      const res = await api.post('/identity/refresh', { refreshToken });

      const { accessToken, refreshToken: newRefreshToken, user } = res.data;
      await get().setToken(accessToken, newRefreshToken);
      if (user) {
        get().setUser(user);
      }
      console.log('[Auth] Session refreshed successfully');
      return true;
    } catch (error: any) {
      console.error('[Auth] Session refresh failed:', error.response?.data || error.message);
      return false;
    }
  },

  unlockWithPin: async (pin: string): Promise<boolean> => {
    // PIN verification now also issues new tokens if needed
    const isValid = await get().verifyPin(pin);
    if (isValid) {
      set({ needsPinVerification: false, lastActiveAt: Date.now() });
    }
    return isValid;
  },

  lockSession: () => {
    console.log('[Auth] Session locked, PIN required');
    set({ needsPinVerification: true, lastActiveAt: Date.now() });
  },

  updateActivity: () => {
    set({ lastActiveAt: Date.now() });
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      // Verify secure storage is available (mobile only)
      if (!isWeb) {
        const storageSecure = await verifySecureStorage();
        if (!storageSecure) {
          console.warn(
            '[Auth] Secure storage verification failed - sensitive data may not be protected',
          );
        }
      }

      const token = isWeb
        ? localStorage.getItem('auth_token')
        : await SecureStore.getItemAsync('auth_token');

      const refreshToken = isWeb
        ? localStorage.getItem(REFRESH_TOKEN_KEY)
        : await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

      const biometricEnabled = isWeb
        ? localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true'
        : (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === 'true';

      const userJson = isWeb
        ? localStorage.getItem('wallet_user')
        : await SecureStore.getItemAsync('wallet_user');
      const user = userJson ? JSON.parse(userJson) : null;

      if (token && user) {
        console.log('[Auth] Restored session from storage');
        set({ token, refreshToken, user, isAuthenticated: true, hasSession: true, biometricEnabled });
      } else if (refreshToken && user) {
        // Only require PIN if we actually have user data to go with the session
        console.log('[Auth] Session found but access token expired, PIN verification required');
        set({
          refreshToken,
          user,
          hasSession: true,
          needsPinVerification: true,
          isAuthenticated: false,
          biometricEnabled,
        });
      } else {
        console.log('[Auth] No complete session found, starting fresh');
        // Clear any orphaned tokens to be safe
        if (token || refreshToken) {
          if (!isWeb) {
            await SecureStore.deleteItemAsync('auth_token');
            await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
          }
        }
        set({ hasSession: false, biometricEnabled, token: null, refreshToken: null, needsPinVerification: false });
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
    set({
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      hasSession: false,
      needsPinVerification: false,
      user: null,
    });
  },
}));
