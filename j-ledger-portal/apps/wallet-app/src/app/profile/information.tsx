import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Modular Components
import { InformationHeader } from '@/components/profile/InformationHeader';
import { UserHeaderCard } from '@/components/profile/UserHeaderCard';
import { InfoSectionsList } from '@/components/profile/InfoSectionsList';
import { EditSheetModal } from '@/components/profile/EditSheetModal';

type ProfileSection = 'GENERAL' | 'ADDRESS' | 'CONTACT' | 'WORK_STUDY';

// Mock User Data
const MOCK_USER = {
  name: 'Alex Johnson',
  avatar: require('../../../assets/images/mock_user_avatar.png'),
  email: 'alex.johnson@email.com',
  phone: '+66 81 234 5678',
  address: {
    street: '123 Sukhumvit Road',
    subdistrict: 'Klong Toei',
    district: 'Klong Toei',
    province: 'Bangkok',
    postalCode: '10110',
  },
  occupation: 'Software Engineer',
  income: '30-50k',
  sourceOfIncome: 'Salary',
  purpose: 'Transfer & Saving',
};

export default function ProfileInformationScreen() {
  const [activeModal, setActiveModal] = useState<ProfileSection | null>(null);
  const [formData, setFormData] = useState(MOCK_USER);

  const handleSave = () => {
    // ในโปรเจกต์จริงใส่ Logic อัปเดตข้อมูลตรงนี้
    setActiveModal(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <InformationHeader />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <UserHeaderCard name={formData.name} avatar={formData.avatar} />

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
        onClose={() => setActiveModal(null)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}
