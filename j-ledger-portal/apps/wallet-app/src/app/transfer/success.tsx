import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Share, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Share2, Home, Download, ArrowDown, QrCode } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Mock Data สำหรับโชว์ในสลิป
const MOCK_MY_USER = {
  name: 'Alex Johnson',
  phone: '081-234-5678',
  avatar: require('../../../assets/images/mock_user_avatar.png'), // ใช้รูป Profile ตัวเอง
};

const MOCK_RECIPIENT_AVATAR = { uri: 'https://randomuser.me/api/portraits/men/55.jpg' };

export default function TransferSuccessScreen() {
  const router = useRouter();
  const { recipient, amount, note, merchantName } = useLocalSearchParams();
  const slipRef = useRef<View>(null);

  const isMerchant = !!merchantName;
  const displayRecipient = (merchantName as string) || (recipient as string);

  // สร้างข้อมูลจำลอง
  const refId = `JLED${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
  const now = new Date();
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
        message: `J-Ledger Transfer Successful!\nAmount: ฿${formattedAmount}\nTo: ${displayRecipient}\nDate: ${dateStr} ${timeStr}\nRef: ${refId}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f48fb1]" edges={['top']}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Success Header Area */}
        <View className="items-center justify-center pt-8 pb-4">
          <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-16 h-16 bg-white rounded-full items-center justify-center mb-4 shadow-lg shadow-black/10"
          >
            <CheckCircle2 size={36} color="#22c55e" />
          </MotiView>
          <Text className="text-2xl font-manrope font-black text-white tracking-tight">
            {isMerchant ? 'Payment Successful' : 'Transfer Successful'}
          </Text>
        </View>

        {/* e-Slip Container */}
        <MotiView
          from={{ translateY: 100, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ delay: 100, type: 'timing', duration: 400 }}
          className="flex-1 bg-[#f8f9fe] rounded-t-[2.5rem] px-5 pt-8 pb-10"
        >
          {/* Slip Card */}
          <View
            ref={slipRef}
            className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Slip Header */}
            <View className="bg-gray-50/80 px-5 py-4 border-b border-gray-100 flex-row justify-between items-start">
              <View>
                <Text className="text-[10px] font-manrope font-bold text-gray-500 uppercase tracking-widest mb-1">
                  {isMerchant ? 'Merchant Payment' : 'Transaction Successful'}
                </Text>
                <Text className="text-xs font-manrope font-black text-gray-800">
                  {dateStr} • {timeStr}
                </Text>
                <Text className="text-[10px] font-manrope font-bold text-gray-400 mt-0.5">
                  Ref: {refId}
                </Text>
              </View>
              <View className="w-8 h-8 bg-pink-100 rounded-xl items-center justify-center">
                <Text className="text-[#f48fb1] font-black text-xs">J</Text>
              </View>
            </View>

            {/* Sender & Receiver Info */}
            <View className="p-5 relative">
              <View className="absolute left-11 top-[4.5rem] bottom-16 w-0.5 bg-gray-200 z-0" />
              <View className="absolute left-[38px] top-[50%] bg-white p-1 rounded-full border border-gray-100 shadow-sm z-10 -translate-y-4">
                <ArrowDown size={14} color="#9ca3af" />
              </View>

              {/* From (Sender) */}
              <View className="flex-row items-center mb-6 relative z-10">
                <View className="p-1 border border-gray-100 rounded-[1.2rem] bg-white">
                  <Image source={MOCK_MY_USER.avatar} className="w-12 h-12 rounded-xl" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-0.5">
                    From
                  </Text>
                  <Text className="text-sm font-manrope font-black text-gray-800">
                    {MOCK_MY_USER.name}
                  </Text>
                  <Text className="text-[10px] font-manrope font-bold text-gray-400 mt-0.5">
                    J-Ledger Wallet
                  </Text>
                </View>
              </View>

              {/* To (Receiver) */}
              <View className="flex-row items-center relative z-10">
                <View className="p-1 border border-gray-100 rounded-[1.2rem] bg-white">
                  {isMerchant ? (
                    <View className="w-12 h-12 rounded-xl bg-pink-50 items-center justify-center border border-pink-100">
                      <QrCode size={24} color="#f48fb1" />
                    </View>
                  ) : (
                    <Image source={MOCK_RECIPIENT_AVATAR} className="w-12 h-12 rounded-xl" />
                  )}
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-0.5">
                    To {isMerchant ? 'Merchant' : 'Recipient'}
                  </Text>
                  <Text className="text-sm font-manrope font-black text-gray-800" numberOfLines={1}>
                    {displayRecipient}
                  </Text>
                  <Text className="text-[10px] font-manrope font-bold text-gray-400 mt-0.5">
                    {isMerchant ? 'PromptPay Merchant' : 'PromptPay / J-Ledger'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Amount Section */}
            <View className="items-center px-5 py-6 bg-pink-50/30 border-y border-dashed border-gray-200">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-2">
                Amount
              </Text>
              <View className="flex-row items-baseline">
                <Text className="text-2xl font-manrope font-black text-[#f48fb1] mr-1">฿</Text>
                <Text className="text-4xl font-manrope font-black text-[#f48fb1] tracking-tighter">
                  {formattedAmount}
                </Text>
              </View>
            </View>

            {/* Note Section (If any) */}
            {note ? (
              <View className="px-5 py-4 bg-white">
                <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-1">
                  Memo
                </Text>
                <Text className="text-xs font-manrope font-bold text-gray-800">{note}</Text>
              </View>
            ) : (
              <View className="h-4" /> // Spacer
            )}
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-4 mt-6">
            <TouchableOpacity
              onPress={onShare}
              className="flex-1 h-14 bg-white rounded-2xl border border-gray-100 items-center justify-center flex-row gap-2 shadow-sm active:scale-95"
            >
              <Share2 size={18} color="#1a1a1a" />
              <Text className="text-xs font-manrope font-black text-gray-800 uppercase tracking-widest">
                Share
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 h-14 bg-white rounded-2xl border border-gray-100 items-center justify-center flex-row gap-2 shadow-sm active:scale-95">
              <Download size={18} color="#1a1a1a" />
              <Text className="text-xs font-manrope font-black text-gray-800 uppercase tracking-widest">
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Back to Home Button */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)' as any)}
            className="w-full h-16 bg-[#f48fb1] rounded-2xl flex-row items-center justify-center gap-2 shadow-lg shadow-pink-200 mt-6 active:scale-95"
          >
            <Home size={20} color="white" />
            <Text className="text-sm font-manrope font-black text-white">Back to Home</Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}
