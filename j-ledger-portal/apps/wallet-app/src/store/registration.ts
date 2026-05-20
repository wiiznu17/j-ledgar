import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/lib/axios';
import axios from 'axios';

import { RegistrationState } from '@repo/dto';

interface RegistrationStore {
  regToken: string | null;
  currentState: RegistrationState;
  isSyncing: boolean;
  prefillData: {
    identity?: {
      idNumber?: string;
      idCardUrl?: string;
      idCardAddress?: string;
      firstNameTh?: string;
      lastNameTh?: string;
      prefixTh?: string;
      firstNameEn?: string;
      lastNameEn?: string;
      prefixEn?: string;
      dateOfBirth?: string;
      issueDate?: string;
      expiryDate?: string;
      religion?: string;
    } | null;
    addresses?: {
      registered?: any;
      current?: any;
    } | null;
    profile?: {
      occupation?: string;
      incomeRange?: string;
      sourceOfFunds?: string;
      purposeOfAccount?: string;
    } | null;
  } | null;
  status: string | null;
  reviewNote: string | null;

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
  currentState: RegistrationState.PENDING_OTP,
  isSyncing: false,
  prefillData: null,
  status: null,
  reviewNote: null,

  setRegToken: async (token: string | null) => {
    if (token) {
      await SecureStore.setItemAsync(REG_TOKEN_KEY, token);
      set({ regToken: token });
    } else {
      await SecureStore.deleteItemAsync(REG_TOKEN_KEY);
      set({
        regToken: null,
        prefillData: null,
        currentState: RegistrationState.PENDING_OTP,
      });
    }
  },

  syncStatus: async () => {
    const { regToken } = get();
    set({ isSyncing: true });
    try {
      // Priority: 1. regToken (Onboarding), 2. accessToken (Authenticated User Retry)
      let token = regToken;
      if (!token) {
        token = await SecureStore.getItemAsync('access_token');
      }

      if (!token) {
        set({ isSyncing: false });
        return RegistrationState.PENDING_OTP;
      }

      const response = await api.post(
        '/identity/register/status',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const { state, status, reviewNote, prefilledData } = response.data;
      console.log(`[Registration] Status synced: ${state} (${status})`);

      set({
        currentState: state,
        status: status || null,
        reviewNote: reviewNote || null,
        prefillData: prefilledData || null,
      });

      return state;
    } catch (error) {
      // If token is invalid (401), clear it silently
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        console.log('[RegistrationStore] Token invalid/expired, clearing');
        await get().reset();
        return RegistrationState.PENDING_OTP;
      }
      // Log only unexpected errors
      console.error('[RegistrationStore] Sync failed:', error);
      return RegistrationState.PENDING_OTP;
    } finally {
      set({ isSyncing: false });
    }
  },

  reset: async () => {
    await SecureStore.deleteItemAsync(REG_TOKEN_KEY);
    set({
      regToken: null,
      currentState: RegistrationState.PENDING_OTP,
      prefillData: null,
    });
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
