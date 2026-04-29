import React, { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

// Modular Components
import { InformationHeader } from '@/components/profile/InformationHeader';
import { UserHeaderCard } from '@/components/profile/UserHeaderCard';
import { InfoSectionsList } from '@/components/profile/InfoSectionsList';
import { EditSheetModal } from '@/components/profile/EditSheetModal';
import { UserProfileService, UserProfile, UpdateProfileData } from '@/lib/user-service';

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

      // Map API response to form data
      setFormData({
        ...DEFAULT_FORM_DATA,
        nameEn: profile.profile?.firstName || '',
        nameTh: profile.profile?.firstName || '',
        phone: profile.phoneNumber || '',
        email: profile.email || '',
        kycTier: profile.registrationState === 'COMPLETED' ? 'Premium Tier' : 'Standard Tier',
        occupation: profile.profile?.occupation || '',
        sourceOfIncome: profile.profile?.sourceOfFunds || '',
        income: profile.profile?.incomeRange || '',
        purpose: profile.profile?.purposeOfAccount || '',
        currentAddress: {
          street: profile.profile?.address || '',
          subdistrict: '',
          district: '',
          province: '',
          postalCode: '',
        },
      });
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
      // Prepare update data
      const updateData: UpdateProfileData = {
        firstName: formData.nameEn,
        lastName: '',
        address: formData.currentAddress.street,
        occupation: formData.occupation,
        incomeRange: formData.income,
        sourceOfFunds: formData.sourceOfIncome,
        purposeOfAccount: formData.purpose,
      };

      await UserProfileService.updateProfile(updateData);
      setActiveModal(null);
    } catch (error) {
      console.error('[Profile Information] Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8f9fe] items-center justify-center">
        <ActivityIndicator size="large" color="#f48fb1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <InformationHeader isSaving={isSaving} setIsSaving={setIsSaving} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <UserHeaderCard
          nameTh={`${formData.prefixTh}${formData.nameTh}`}
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
