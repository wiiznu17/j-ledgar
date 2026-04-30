import api from './axios';

export type AddressType = 'REGISTERED' | 'CURRENT' | 'WORK' | 'SHIPPING' | 'BILLING';

export interface Address {
  id: string;
  userId: string;
  type: AddressType;
  label?: string;
  line1?: string;
  line2?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  countryCode: string;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

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
    occupation?: string;
    incomeRange?: string;
    sourceOfFunds?: string;
    purposeOfAccount?: string;
  };
  addresses: Address[];
  kycData?: {
    firstNameTh?: string;
    lastNameTh?: string;
    firstNameEn?: string;
    lastNameEn?: string;
    idCardName?: string;
    dateOfBirth?: string;
    verificationStatus?: string;
    verifiedAt?: string;
  };
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  occupation?: string;
  incomeRange?: string;
  sourceOfFunds?: string;
  purposeOfAccount?: string;
}

export interface UpdateAddressData {
  line1?: string;
  line2?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  label?: string;
  countryCode?: string;
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

  updateAddress: async (type: AddressType, data: UpdateAddressData): Promise<Address> => {
    const response = await api.put(`/identity/address/${type}`, data);
    return response.data;
  },
};
