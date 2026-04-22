import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Modular Components
import { InformationHeader } from '@/components/profile/InformationHeader';
import { UserHeaderCard } from '@/components/profile/UserHeaderCard';
import { InfoSectionsList } from '@/components/profile/InfoSectionsList';
import { EditSheetModal } from '@/components/profile/EditSheetModal';

type ProfileSection = 'IDENTIFICATION' | 'ADDRESS' | 'CONTACT' | 'EMPLOYMENT';

// Mock User Data
const MOCK_USER = {
  prefixTh: 'นาย',
  nameTh: 'อเล็กซ์ จอห์นสัน',
  prefixEn: 'Mr.',
  nameEn: 'Alex Johnson',
  avatar: require('../../../assets/images/mock_user_avatar.png'),
  phone: '0812345678',
  email: 'alex.johnson@email.com',
  kycTier: 'Tier 2 Premium',
  idNumber: '1234567890123',
  dob: '15/05/1990',
  idAddress: {
    street: '123 Sukhumvit Road',
    subdistrict: 'Klong Toei',
    district: 'Klong Toei',
    province: 'Bangkok',
    postalCode: '10110',
  },
  currentAddress: {
    street: '123 Sukhumvit Road',
    subdistrict: 'Klong Toei',
    district: 'Klong Toei',
    province: 'Bangkok',
    postalCode: '10110',
  },
  workAddress: {
    street: 'G Tower, Rama 9 Road',
    subdistrict: 'Huai Khwang',
    district: 'Huai Khwang',
    province: 'Bangkok',
    postalCode: '10310',
  },
  occupation: 'Software Engineer',
  sourceOfIncome: 'Personal Salary',
  income: '30,000 - 50,000',
  purpose: 'Investment & Saving',
};

export default function ProfileInformationScreen() {
  const [activeModal, setActiveModal] = useState<ProfileSection | null>(null);
  const [formData, setFormData] = useState(MOCK_USER);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (isSaving) return;
    setIsSaving(true);
    // ในโปรเจกต์จริงใส่ Logic อัปเดตข้อมูลตรงนี้
    setTimeout(() => {
      setActiveModal(null);
      setIsSaving(false);
    }, 1200);
  };

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
