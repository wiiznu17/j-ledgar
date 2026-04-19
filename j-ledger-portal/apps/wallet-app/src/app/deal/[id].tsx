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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Zap, Info, CheckCircle2, X } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { MOCK_DEALS } from '../(tabs)/deals'; // ดึง Mock มาจากไฟล์หลัก

const { width } = Dimensions.get('window');

export default function DealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const deal = MOCK_DEALS.find((d) => d.id === id);

  if (!deal) return null;

  const handleRedeem = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setShowConfirm(false);

    // Mock Processing time
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      // Mock Success display time
      setTimeout(() => {
        router.replace('/deal/my-deals' as any);
      }, 1500);
    }, 1500);
  };

  return (
    <View className="flex-1 bg-[#f8f9fe]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Full Image Header */}
        <View className="relative w-full h-[350px] bg-white">
          <Image source={deal.image} className="w-full h-full" resizeMode="cover" />

          {/* Back Button Floating */}
          <SafeAreaView
            className="absolute top-0 left-0 right-0 px-5 pt-2 flex-row"
            edges={['top']}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl items-center justify-center shadow-sm"
            >
              <ChevronLeft size={24} color="#1a1a1a" />
            </TouchableOpacity>
          </SafeAreaView>

          <View className="absolute bottom-5 left-5 bg-[#f48fb1] px-4 py-2 rounded-xl shadow-lg">
            <Text className="text-white text-[10px] font-manrope font-black uppercase tracking-widest">
              {deal.tag}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-5 pt-6 space-y-6">
          <View>
            <Text className="text-2xl font-manrope font-black text-gray-800 tracking-tight">
              {deal.title}
            </Text>
            <Text className="text-sm font-manrope font-bold text-gray-400 mt-2 leading-relaxed">
              {deal.desc}
            </Text>
          </View>

          <View className="bg-white p-5 rounded-[2rem] border border-gray-50 shadow-sm flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 bg-pink-50 rounded-2xl items-center justify-center">
                <Zap size={20} color="#f48fb1" fill="#f48fb1" />
              </View>
              <View>
                <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest">
                  Required
                </Text>
                <Text className="text-xl font-manrope font-black text-[#f48fb1]">
                  {deal.points} pts
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest">
                Balance
              </Text>
              <Text className="text-sm font-manrope font-black text-gray-800">1,250 pts</Text>
            </View>
          </View>

          <View className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100 flex-row gap-4 mb-10">
            <Info size={20} color="#9ca3af" />
            <Text className="flex-1 text-[11px] font-manrope font-bold text-gray-500 leading-relaxed">
              Once redeemed, the points cannot be refunded. The voucher will be available in "My
              Deals" section.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 pt-4 bg-white/90 border-t border-gray-50"
        style={{ paddingBottom: Platform.OS === 'ios' ? 34 : 24 }}
      >
        <TouchableOpacity
          disabled={isProcessing || isSuccess}
          onPress={() => setShowConfirm(true)}
          className="w-full h-16 bg-[#f48fb1] rounded-2xl flex-row items-center justify-center gap-2 shadow-lg shadow-pink-200 active:scale-95 transition-all"
        >
          <Text className="font-manrope font-black text-base text-white">Redeem Deal</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <View className="absolute inset-0 z-[60] justify-end">
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
            />
            <TouchableOpacity activeOpacity={1} onPress={() => setShowConfirm(false)} className="absolute inset-0" />
            
            <MotiView
              from={{ translateY: 500 }}
              animate={{ translateY: 0 }}
              exit={{ translateY: 500 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-[2.5rem] p-8 pb-12 shadow-2xl"
            >
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-manrope font-black text-gray-800">Confirm Deal</Text>
                <TouchableOpacity 
                  onPress={() => setShowConfirm(false)}
                  className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
                >
                  <X size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <View className="bg-pink-50/50 p-6 rounded-3xl border border-pink-100 mb-8 items-center">
                <Text className="text-[10px] font-manrope font-black text-pink-400 uppercase tracking-[0.2em] mb-2">Total Points to Use</Text>
                <Text className="text-4xl font-manrope font-black text-[#f48fb1]">{deal.points} pts</Text>
                <View className="h-px w-full bg-pink-100 my-4" />
                <Text className="text-[11px] font-manrope font-bold text-gray-400 text-center">Are you sure you want to redeem this deal?</Text>
              </View>

              <View className="flex-row gap-4">
                <TouchableOpacity
                  onPress={() => setShowConfirm(false)}
                  className="flex-1 h-14 bg-gray-50 rounded-2xl items-center justify-center"
                >
                  <Text className="font-manrope font-black text-gray-400">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRedeem}
                  disabled={isProcessing}
                  className="flex-2 h-14 bg-[#f48fb1] rounded-2xl items-center justify-center shadow-lg shadow-pink-200"
                  style={{ flex: 2 }}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="font-manrope font-black text-white">Confirm Redeem</Text>
                  )}
                </TouchableOpacity>
              </View>
            </MotiView>
          </View>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {isSuccess && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 items-center justify-center z-50 p-10"
          >
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring' }}
              className="w-24 h-24 bg-green-50 rounded-[2.5rem] items-center justify-center mb-6 shadow-xl shadow-green-100"
            >
              <CheckCircle2 size={40} color="#22c55e" />
            </MotiView>
            <Text className="text-2xl font-manrope font-black text-gray-800 tracking-tight text-center">
              Deal Redeemed!
            </Text>
            <Text className="text-sm font-manrope font-bold text-gray-400 mt-2 text-center">
              Adding to your My Deals...
            </Text>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}
