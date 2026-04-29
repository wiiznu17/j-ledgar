import api from './axios';

export interface UserProfile {
  id: string;
  phoneNumber: string;
  email?: string;
  status: string;
  registrationState: string;
  ledgerAccountId?: string;
  createdAt: string;
  profile: {
    firstName?: string;
    lastName?: string;
    address?: string;
    occupation?: string;
    incomeRange?: string;
    sourceOfFunds?: string;
    purposeOfAccount?: string;
  };
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  address?: string;
  occupation?: string;
  incomeRange?: string;
  sourceOfFunds?: string;
  purposeOfAccount?: string;
}

export const UserProfileService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/identity/profile');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileData): Promise<{ success: boolean }> => {
    const response = await api.put('/identity/profile', data);
    return response.data;
  },
};
