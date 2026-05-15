import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Share,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Share2,
  Home,
  Download,
  ArrowDown,
  QrCode,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TransactionReceipt } from '@/components/transaction/TransactionReceipt';

const { width } = Dimensions.get('window');

// Mock Data สำหรับโชว์ในสลิป
const MOCK_MY_USER = {
  name: 'Alex Johnson',
  phone: '081-234-5678',
  avatar: require('../../../assets/images/mock_user_avatar.png'), // ใช้รูป Profile ตัวเอง
};

const MOCK_RECIPIENT_AVATAR = {
  uri: 'https://randomuser.me/api/portraits/men/55.jpg',
};

export default function TransferSuccessScreen() {
  const router = useRouter();
  const {
    recipient,
    amount,
    note,
    merchantName,
    transactionId,
    createdAt,
    recipientName,
    recipientMasked,
  } = useLocalSearchParams();
  const slipRef = useRef<View>(null);

  const isMerchant = !!merchantName;
  const displayRecipient =
    (recipientName as string) ||
    (merchantName as string) ||
    (recipient as string);
  const refId = (transactionId as string) || '-';
  const now = createdAt ? new Date(createdAt as string) : new Date();
  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // แปลง amount ให้มีคอมม่า
  const formattedAmount = amount
    ? parseFloat(amount as string).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00';

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);
  const onShare = async () => {
    try {
      await Share.share({
        message: `P-wallet Transfer Successful!\nAmount: ฿${formattedAmount}\nTo: ${displayRecipient}\nDate: ${dateStr} ${timeStr}\nRef: ${refId}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <TransactionReceipt 
          amount={parseFloat(amount as string) || 0}
          transactionId={(transactionId as string) || '-'}
          timestamp={(createdAt as string) || new Date().toISOString()}
          recipientName={displayRecipient}
          recipientType={isMerchant ? 'merchant' : 'user'}
          onDone={() => router.replace('/(tabs)')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
