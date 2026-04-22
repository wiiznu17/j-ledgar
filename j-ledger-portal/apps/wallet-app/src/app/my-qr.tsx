import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

// Sub-components
import { QRHeader } from '@/components/my-qr/QRHeader';
import { QRCard } from '@/components/my-qr/QRCard';
import { AmountTriggerButton } from '@/components/my-qr/AmountTriggerButton';
import { QRActionButtons } from '@/components/my-qr/QRActionButtons';
import { QRInfoBanner } from '@/components/my-qr/QRInfoBanner';
import { AmountModal } from '@/components/my-qr/AmountModal';

// Constants
import { MOCK_USER } from '@/constants/mockData';

export default function MyQrScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempAmount, setTempAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // สร้างข้อมูลสำหรับ QR Code โดยแนบจำนวนเงินเข้าไปถ้ามีการระบุ
  const qrData =
    amount && parseFloat(amount) > 0
      ? `${MOCK_USER.walletId}?amount=${amount}`
      : MOCK_USER.walletId;

  // ใช้สีเทาเข้ม (1a1a1a) เพื่อให้กล้องอ่าน QR ได้ง่ายขึ้น
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    qrData,
  )}&color=1a1a1a&bgcolor=f8f9fe`;

  const handleSetAmount = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setAmount(tempAmount);
    setTimeout(() => {
      setIsModalVisible(false);
      setIsProcessing(false);
    }, 400); // จำลองการคำนวณ QR เล็กน้อย
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
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
            name={MOCK_USER.name}
            walletId={MOCK_USER.walletId}
            avatar={MOCK_USER.avatar}
            qrUrl={qrUrl}
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

        <QRActionButtons isProcessing={isProcessing} setIsProcessing={setIsProcessing} />
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
