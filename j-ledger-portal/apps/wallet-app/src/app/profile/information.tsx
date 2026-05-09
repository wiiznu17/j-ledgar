import React, { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

// Modular Components
import { InformationHeader } from '@/components/profile/InformationHeader';
import { UserHeaderCard } from '@/components/profile/UserHeaderCard';
import { InfoSectionsList } from '@/components/profile/InfoSectionsList';
import { EditSheetModal } from '@/components/profile/EditSheetModal';
import { UserProfileService, UserProfile, UpdateProfileData } from '@/lib/user-service';
import { RegistrationState, AddressType } from '@repo/dto';

type ProfileSection = 'IDENTIFICATION' | 'ADDRESS' | 'CONTACT' | 'EMPLOYMENT';

interface FormData {
  prefixTh: string;
  nameTh: string;
  prefixEn: string;
  nameEn: string;
  avatar: any;
  phone: string;
  email: string;
  kycTier: string;
  idNumber: string;
  dob: string;
  idAddress: {
    street: string;
    subdistrict: string;
    district: string;
    province: string;
    postalCode: string;
  };
  currentAddress: {
    street: string;
    subdistrict: string;
    district: string;
    province: string;
    postalCode: string;
  };
  workAddress: {
    street: string;
    subdistrict: string;
    district: string;
    province: string;
    postalCode: string;
  };
  occupation: string;
  sourceOfIncome: string;
  income: string;
  purpose: string;
}

const DEFAULT_FORM_DATA: FormData = {
  prefixTh: 'นาย',
  nameTh: '',
  prefixEn: 'Mr.',
  nameEn: '',
  avatar: require('../../../assets/images/mock_user_avatar.png'),
  phone: '',
  email: '',
  kycTier: 'Standard',
  idNumber: '',
  dob: '',
  idAddress: {
    street: '',
    subdistrict: '',
    district: '',
    province: '',
    postalCode: '',
  },
  currentAddress: {
    street: '',
    subdistrict: '',
    district: '',
    province: '',
    postalCode: '',
  },
  workAddress: {
    street: '',
    subdistrict: '',
    district: '',
    province: '',
    postalCode: '',
  },
  occupation: '',
  sourceOfIncome: '',
  income: '',
  purpose: '',
};

export default function ProfileInformationScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<ProfileSection | null>(null);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      const profile: UserProfile = await UserProfileService.getProfile();
      console.log('profile from backend = ', profile);

      // Map API response to form data
      setFormData({
        ...DEFAULT_FORM_DATA,
        nameEn:
          profile.kycData?.firstNameEn || profile.kycData?.lastNameEn
            ? `${profile.kycData.firstNameEn || ''} ${profile.kycData.lastNameEn || ''}`.trim()
            : `${profile.profile?.firstName || ''} ${profile.profile?.lastName || ''}`.trim(),
        nameTh:
          profile.kycData?.firstNameTh || profile.kycData?.lastNameTh
            ? `${profile.kycData.firstNameTh || ''} ${profile.kycData.lastNameTh || ''}`.trim()
            : `${profile.profile?.firstName || ''} ${profile.profile?.lastName || ''}`.trim(),
        phone: profile.phoneNumber || '',
        email: profile.email || '',
        kycTier:
          profile.registrationState === RegistrationState.COMPLETED
            ? 'Premium Tier'
            : 'Standard Tier',
        occupation: profile.profile?.occupation || '',
        sourceOfIncome: profile.profile?.sourceOfFunds || '',
        income: profile.profile?.incomeRange || '',
        purpose: profile.profile?.purposeOfAccount || '',
        idAddress: profile.addresses?.find((a) => a.type === AddressType.REGISTERED)
          ? {
              street: profile.addresses.find((a) => a.type === AddressType.REGISTERED)?.line1 || '',
              subdistrict:
                profile.addresses.find((a) => a.type === AddressType.REGISTERED)?.subdistrict || '',
              district:
                profile.addresses.find((a) => a.type === AddressType.REGISTERED)?.district || '',
              province:
                profile.addresses.find((a) => a.type === AddressType.REGISTERED)?.province || '',
              postalCode:
                profile.addresses.find((a) => a.type === AddressType.REGISTERED)?.postalCode || '',
            }
          : DEFAULT_FORM_DATA.idAddress,
        currentAddress: profile.addresses?.find((a) => a.type === AddressType.CURRENT)
          ? {
              street: profile.addresses.find((a) => a.type === AddressType.CURRENT)?.line1 || '',
              subdistrict:
                profile.addresses.find((a) => a.type === AddressType.CURRENT)?.subdistrict || '',
              district:
                profile.addresses.find((a) => a.type === AddressType.CURRENT)?.district || '',
              province:
                profile.addresses.find((a) => a.type === AddressType.CURRENT)?.province || '',
              postalCode:
                profile.addresses.find((a) => a.type === AddressType.CURRENT)?.postalCode || '',
            }
          : DEFAULT_FORM_DATA.currentAddress,
        workAddress: profile.addresses?.find((a) => a.type === AddressType.WORK)
          ? {
              street: profile.addresses.find((a) => a.type === AddressType.WORK)?.line1 || '',
              subdistrict:
                profile.addresses.find((a) => a.type === AddressType.WORK)?.subdistrict || '',
              district: profile.addresses.find((a) => a.type === AddressType.WORK)?.district || '',
              province: profile.addresses.find((a) => a.type === AddressType.WORK)?.province || '',
              postalCode:
                profile.addresses.find((a) => a.type === AddressType.WORK)?.postalCode || '',
            }
          : DEFAULT_FORM_DATA.workAddress,
      });
      console.log('profile data = ', formData);
    } catch (error) {
      console.error('[Profile Information] Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when screen is focused
  useEffect(() => {
    fetchProfile();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, []),
  );

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // Split nameEn into firstName and lastName
      const nameParts = (formData.nameEn || '').trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const updateData: UpdateProfileData = {
        firstName,
        lastName,
        occupation: formData.occupation,
        incomeRange: formData.income,
        sourceOfFunds: formData.sourceOfIncome,
        purposeOfAccount: formData.purpose,
      };

      // 1. Update Profile (JSON settings)
      await UserProfileService.updateProfile(updateData);

      // 2. Update Address (Targeted model)
      if (activeModal === 'ADDRESS') {
        await UserProfileService.updateAddress('CURRENT', {
          line1: formData.currentAddress.street,
          subdistrict: formData.currentAddress.subdistrict,
          district: formData.currentAddress.district,
          province: formData.currentAddress.province,
          postalCode: formData.currentAddress.postalCode,
        });
      }

      if (activeModal === 'EMPLOYMENT') {
        await UserProfileService.updateAddress('WORK', {
          line1: formData.workAddress.street,
          subdistrict: formData.workAddress.subdistrict,
          district: formData.workAddress.district,
          province: formData.workAddress.province,
          postalCode: formData.workAddress.postalCode,
        });
      }

      // Re-fetch profile data to sync UI
      await fetchProfile();

      setActiveModal(null);
      Alert.alert('Success', 'Your profile has been updated successfully.');
    } catch (error) {
      console.error('[Profile Information] Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-transparent items-center justify-center">
        <ActivityIndicator size="large" color="#f48fb1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
      <InformationHeader isSaving={isSaving} setIsSaving={setIsSaving} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <UserHeaderCard
          nameTh={`${formData.prefixTh} ${formData.nameTh}`}
          nameEn={`${formData.prefixEn} ${formData.nameEn}`}
          avatar={formData.avatar}
          phone={formData.phone}
          kycTier={formData.kycTier}
        />

        <InfoSectionsList
          formData={formData}
          onEdit={(section) => setActiveModal(section as ProfileSection)}
        />
      </ScrollView>

      <EditSheetModal
        visible={activeModal !== null}
        activeModal={activeModal}
        formData={formData}
        setFormData={setFormData}
        onClose={() => !isSaving && setActiveModal(null)}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </SafeAreaView>
  );
}
