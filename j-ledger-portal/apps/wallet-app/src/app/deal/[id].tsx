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
import { MotiView, AnimatePresence } from 'moti';
import { MOCK_DEALS } from '../(tabs)/deals'; // ตรวจสอบ Path ให้ตรงกับโปรเจกต์ของคุณ

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

      {/* --------------------------------------------------- */}
      {/* 1) Confirmation Modal (Bottom Sheet) */}
      {/* --------------------------------------------------- */}
      <Modal visible={showConfirm} transparent animationType="none">
        <View className="flex-1 justify-end">
          {/* Backdrop */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
          />
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => !isProcessing && setShowConfirm(false)}
            className="absolute inset-0"
          />

          {/* Sheet */}
          <MotiView
            from={{ translateY: 600 }}
            animate={{ translateY: 0 }}
            exit={{ translateY: 600 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="bg-white rounded-t-[2.5rem] p-8 shadow-2xl"
            style={{ paddingBottom: Math.max(insets.bottom, 32) }}
          >
            {/* Grabber Pill */}
            <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />

            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-manrope font-black text-gray-800 tracking-tight">
                Confirm Redeem
              </Text>
              <TouchableOpacity
                onPress={() => !isProcessing && setShowConfirm(false)}
                className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
              >
                <X size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="bg-pink-50/50 p-6 rounded-[2rem] border border-pink-100 mb-8 items-center">
              <Text className="text-[10px] font-manrope font-black text-pink-400 uppercase tracking-[0.2em] mb-2">
                Points to Deduct
              </Text>
              <Text className="text-5xl font-manrope font-black text-[#f48fb1] tracking-tighter">
                {deal.points.toLocaleString()}
              </Text>
              <View className="h-px w-full bg-pink-100/50 my-5" />
              <Text className="text-xs font-manrope font-bold text-gray-500 text-center leading-relaxed">
                You are about to redeem{' '}
                <Text className="font-black text-gray-700">{deal.title}</Text>.
              </Text>
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setShowConfirm(false)}
                disabled={isProcessing}
                className="flex-1 h-16 bg-gray-50 border border-gray-100 rounded-2xl items-center justify-center active:scale-95"
              >
                <Text className="font-manrope font-black text-gray-500">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRedeem}
                disabled={isProcessing}
                className="flex-[2] h-16 bg-[#f48fb1] rounded-2xl items-center justify-center shadow-lg shadow-pink-200 active:scale-95"
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="font-manrope font-black text-white text-base">Confirm</Text>
                )}
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Modal>

      {/* --------------------------------------------------- */}
      {/* 2) Success Overlay Modal */}
      {/* --------------------------------------------------- */}
      <Modal visible={isSuccess} transparent animationType="fade">
        <View className="flex-1 bg-white/95 items-center justify-center p-10">
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="w-28 h-28 bg-green-50 rounded-[2.5rem] items-center justify-center mb-6 shadow-xl shadow-green-100 border border-green-100"
          >
            <CheckCircle2 size={48} color="#22c55e" />
          </MotiView>
          <MotiView
            from={{ translateY: 20, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ delay: 200 }}
          >
            <Text className="text-3xl font-manrope font-black text-gray-800 tracking-tight text-center">
              Redeemed!
            </Text>
            <Text className="text-base font-manrope font-bold text-gray-400 mt-3 text-center leading-relaxed">
              Added to your My Deals.{'\n'}Redirecting...
            </Text>
          </MotiView>
        </View>
      </Modal>
    </View>
  );
}
