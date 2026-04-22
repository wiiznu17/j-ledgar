import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Zap, Info, CheckCircle2, X } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MOCK_DEALS } from '@/app/(tabs)/deals';
import { RedemptionConfirmationModal } from '@/components/deal/RedemptionConfirmationModal';
import { RedemptionSuccessOverlay } from '@/components/deal/RedemptionSuccessOverlay';

const { width } = Dimensions.get('window');

export default function DealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const deal = MOCK_DEALS.find((d) => d.id === id);

  if (!deal) return null;

  const handleRedeem = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Mock Processing time
    setTimeout(() => {
      setIsProcessing(false);
      setShowConfirm(false); // ปิด Modal ยืนยัน

      // หน่วงเวลาเล็กน้อยก่อนโชว์ Success ป้องกัน UI กระตุก
      setTimeout(() => {
        setIsSuccess(true);
        // Mock Success display time ก่อนเด้งไปหน้า My Deals
        setTimeout(() => {
          setIsSuccess(false);
          router.replace('/deal/my-deals' as any);
        }, 1800);
      }, 300);
    }, 1500);
  };

  return (
    <View className="flex-1 bg-[#f8f9fe]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Full Image Header */}
        <View className="relative w-full h-[380px] bg-white rounded-b-[3rem] overflow-hidden shadow-sm">
          <Image source={deal.image} className="w-full h-full" resizeMode="cover" />
          {/* Dark gradient overlay ด้านบน เพื่อให้ปุ่ม Back เห็นชัดเสมอ */}
          <View className="absolute top-0 left-0 right-0 h-32 bg-black/20" />

          {/* Back Button Floating */}
          <View className="absolute left-5" style={{ top: Math.max(insets.top, 20) }}>
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 bg-white/90 rounded-2xl items-center justify-center shadow-md active:scale-95"
            >
              <ChevronLeft size={24} color="#1a1a1a" />
            </TouchableOpacity>
          </View>

          {/* Tag Badge */}
          <View className="absolute bottom-6 left-6 bg-[#f48fb1] px-4 py-2 rounded-xl shadow-lg shadow-pink-200">
            <Text className="text-white text-[10px] font-manrope font-black uppercase tracking-widest">
              {deal.tag}
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View className="px-5 pt-8 space-y-6">
          <View>
            <Text className="text-3xl font-manrope font-black text-gray-800 tracking-tight leading-tight">
              {deal.title}
            </Text>
            <Text className="text-sm font-manrope font-bold text-gray-400 mt-2 leading-relaxed">
              {deal.desc}
            </Text>
          </View>

          {/* Points Card */}
          <View className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm shadow-pink-100/30 flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <View className="w-14 h-14 bg-pink-50 rounded-[1.2rem] items-center justify-center border border-pink-100">
                <Zap size={22} color="#f48fb1" fill="#f48fb1" />
              </View>
              <View>
                <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-0.5">
                  Required Points
                </Text>
                <Text className="text-2xl font-manrope font-black text-[#f48fb1] tracking-tighter">
                  {deal.points.toLocaleString()} <Text className="text-sm">pts</Text>
                </Text>
              </View>
            </View>
            <View className="items-end justify-center">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-0.5">
                My Balance
              </Text>
              <Text className="text-base font-manrope font-black text-gray-800 tracking-tighter">
                1,250 <Text className="text-xs">pts</Text>
              </Text>
            </View>
          </View>

          {/* Info Notice */}
          <View className="bg-gray-50 p-5 rounded-[1.8rem] border border-gray-100 flex-row gap-4 mb-6">
            <Info size={20} color="#9ca3af" className="mt-0.5" />
            <Text className="flex-1 text-[11px] font-manrope font-bold text-gray-500 leading-relaxed">
              Once redeemed, points cannot be refunded. The voucher will be available instantly in
              your "My Deals" section.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 pt-4 bg-white/95 border-t border-gray-50"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <TouchableOpacity
          onPress={() => setShowConfirm(true)}
          className="w-full h-16 bg-[#f48fb1] rounded-2xl flex-row items-center justify-center gap-2 shadow-xl shadow-pink-200 active:scale-95 transition-all"
        >
          <Text className="font-manrope font-black text-base text-white">Redeem This Deal</Text>
        </TouchableOpacity>
      </View>

      <RedemptionConfirmationModal
        isVisible={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleRedeem}
        points={deal.points}
        dealTitle={deal.title}
        isProcessing={isProcessing}
      />

      <RedemptionSuccessOverlay isVisible={isSuccess} />
    </View>
  );
}
