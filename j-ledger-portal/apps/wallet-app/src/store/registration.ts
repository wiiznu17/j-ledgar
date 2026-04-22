import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
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
}

const REG_TOKEN_KEY = 'registration_token';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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
      const response = await axios.post(
        `${API_URL}/auth/register/status`,
        {},
        {
          headers: { Authorization: `Bearer ${regToken}` },
        },
      );

      const { state, phoneNumber, ocrData, profile } = response.data;
      console.log(`[Registration] Status synced: ${state} (${phoneNumber || 'No phone'})`);

      set({
        currentState: state,
        prefillData: {
          phoneNumber,
          firstName: profile?.firstName || ocrData?.firstName,
          lastName: profile?.lastName || ocrData?.lastName,
          dob: profile?.dateOfBirth,
        },
      });

      return state;
    } catch (error) {
      console.error('[RegistrationStore] Sync failed:', error);
      // If token is invalid, clear it
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await get().reset();
      }
      return 'PENDING_OTP';
    } finally {
      set({ isSyncing: false });
    }
  },

  reset: async () => {
    await SecureStore.deleteItemAsync(REG_TOKEN_KEY);
    set({ regToken: null, currentState: 'PENDING_OTP', prefillData: null });
  },
}));
