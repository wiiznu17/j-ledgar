import React, { useState, useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

// Sub-components
import { QRHeader } from '@/components/my-qr/QRHeader';
import { QRCard, QRCardRef } from '@/components/my-qr/QRCard';
import { AmountTriggerButton } from '@/components/my-qr/AmountTriggerButton';
import { QRActionButtons } from '@/components/my-qr/QRActionButtons';
import { QRInfoBanner } from '@/components/my-qr/QRInfoBanner';
import { AmountModal } from '@/components/my-qr/AmountModal';

// Services
import { UserProfileService, UserProfile } from '@/lib/user-service';

// Constants
import { MOCK_USER } from '@/constants/mockData';

export default function MyQrScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempAmount, setTempAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const qrCardRef = useRef<QRCardRef>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await UserProfileService.getProfile();
      console.log('[MyQR] User profile loaded:', profile);
      setUserProfile(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert E.164 phone number to local 10-digit format
  const toLocalPhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('66') && digits.length === 11) {
      return `0${digits.slice(2)}`;
    }
    if (digits.startsWith('0') && digits.length === 10) {
      return digits;
    }
    // Fallback to mock if format is unexpected
    return MOCK_USER.phone;
  };

  // Get phone number from real user profile or fallback to mock
  const phoneNumber = userProfile?.phoneNumber
    ? toLocalPhone(userProfile.phoneNumber)
    : MOCK_USER.phone;

  // Get user name from profile (English) or kycData (Thai) or fallback to mock
  const userName = userProfile?.profile?.firstName
    ? `${userProfile.profile.firstName} ${userProfile.profile.lastName || ''}`.trim()
    : userProfile?.kycData?.firstNameTh
      ? `${userProfile.kycData.firstNameTh} ${userProfile.kycData.lastNameTh || ''}`.trim()
      : MOCK_USER.name;

  // สร้างข้อมูลสำหรับ QR Code โดยแนบจำนวนเงินเข้าไปถ้ามีการระบุ
  const qrData =
    amount && parseFloat(amount) > 0
      ? `JLEDGER:${phoneNumber}:${amount}`
      : `JLEDGER:${phoneNumber}`;

  const handleSetAmount = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setAmount(tempAmount);
    setTimeout(() => {
      setIsModalVisible(false);
      setIsProcessing(false);
    }, 400); // จำลองการคำนวณ QR เล็กน้อย
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
        <QRHeader isProcessing={false} setIsProcessing={() => {}} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
      <QRHeader isProcessing={isProcessing} setIsProcessing={setIsProcessing} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="mt-2"
        >
          <QRCard
            ref={qrCardRef}
            name={userName}
            phone={phoneNumber}
            avatar={MOCK_USER.avatar}
            qrData={qrData}
            amount={amount}
          />

          <AmountTriggerButton
            amount={amount}
            onPress={() => {
              setTempAmount(amount);
              setIsModalVisible(true);
            }}
          />
        </MotiView>

        <QRActionButtons
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          qrCardRef={qrCardRef}
        />
        <QRInfoBanner />
      </ScrollView>

      <AmountModal
        isVisible={isModalVisible}
        onClose={() => !isProcessing && setIsModalVisible(false)}
        tempAmount={tempAmount}
        setTempAmount={setTempAmount}
        onConfirm={handleSetAmount}
        isProcessing={isProcessing}
      />
    </SafeAreaView>
  );
}
