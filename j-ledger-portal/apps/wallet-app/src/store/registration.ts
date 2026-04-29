import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/axios';
import axios from 'axios';

// Align with Backend RegistrationState
export type RegistrationState =
  | 'PENDING_OTP'
  | 'OTP_VERIFIED'
  | 'TC_ACCEPTED'
  | 'ID_CARD_UPLOADED'
  | 'KYC_VERIFIED'
  | 'PROFILE_COMPLETED'
  | 'PASSWORD_SET'
  | 'CREDENTIALS_SET'
  | 'COMPLETED';

interface RegistrationStore {
  regToken: string | null;
  currentState: RegistrationState;
  isSyncing: boolean;
  prefillData: {
    phoneNumber?: string;
    firstName?: string;
    lastName?: string;
    dob?: string;
  } | null;

  setRegToken: (token: string | null) => Promise<void>;
  syncStatus: () => Promise<RegistrationState>;
  reset: () => Promise<void>;
  initialize: () => Promise<void>;
}

const REG_TOKEN_KEY = 'registration_token';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Load persisted token on initialization
const loadPersistedToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(REG_TOKEN_KEY);
  } catch (error) {
    console.error('[RegistrationStore] Failed to load token:', error);
    return null;
  }
};

export const useRegistrationStore = create<RegistrationStore>((set, get) => ({
  regToken: null,
  currentState: 'PENDING_OTP',
  isSyncing: false,
  prefillData: null,

  setRegToken: async (token: string | null) => {
    if (token) {
      await SecureStore.setItemAsync(REG_TOKEN_KEY, token);
      set({ regToken: token });
    } else {
      await SecureStore.deleteItemAsync(REG_TOKEN_KEY);
      set({ regToken: null, prefillData: null, currentState: 'PENDING_OTP' });
    }
  },

  syncStatus: async () => {
    const { regToken } = get();
    if (!regToken) return 'PENDING_OTP';

    set({ isSyncing: true });
    try {
      const response = await api.post(
        '/identity/register/status',
        {},
        {
          headers: { Authorization: `Bearer ${regToken}` },
        },
      );

      const { state, prefilledData } = response.data;
      console.log(`[Registration] Status synced: ${state}`);

      set({
        currentState: state,
        prefillData: prefilledData
          ? {
              firstName: prefilledData.firstName,
              lastName: prefilledData.lastName,
            }
          : null,
      });

      return state;
    } catch (error) {
      // If token is invalid (401), clear it silently
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.log('[RegistrationStore] Token invalid/expired, clearing');
        await get().reset();
        return 'PENDING_OTP';
      }
      // Log only unexpected errors
      console.error('[RegistrationStore] Sync failed:', error);
      return 'PENDING_OTP';
    } finally {
      set({ isSyncing: false });
    }
  },

  reset: async () => {
    await SecureStore.deleteItemAsync(REG_TOKEN_KEY);
    set({ regToken: null, currentState: 'PENDING_OTP', prefillData: null });
  },

  initialize: async () => {
    const token = await loadPersistedToken();
    if (token) {
      set({ regToken: token });
      // Sync status with backend
      await get().syncStatus();
    }
  },
}));
