import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Landmark, ArrowRight, CheckCircle2, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

export default function TopupScreen() {
  const [amount, setAmount] = useState('');
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    // ส่งยอดเงินไปตรวจสอบที่หน้า Review
    router.push({
      pathname: '/topup/review',
      params: { amount },
    } as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-5">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-2 pb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"
            >
              <ChevronLeft size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
              Top Up Wallet
            </Text>
            <TouchableOpacity className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
              <Zap size={20} color="#f48fb1" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Amount Section */}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="bg-white p-8 rounded-[2.5rem] mb-8 items-center overflow-hidden border border-gray-50 shadow-xl shadow-pink-100/50 mt-2"
            >
              <View className="absolute -top-10 -right-10 w-32 h-32 bg-pink-50 rounded-full opacity-60" />

              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-6">
                Select Top Up Amount
              </Text>

              <View className="flex-row items-center justify-center border-b-2 border-pink-100 pb-3 mb-8 w-full max-w-[260px]">
                <Text className="text-3xl font-manrope font-black text-gray-400 mr-2 mt-1">฿</Text>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor="#d1d5db"
                  value={amount}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9.]/g, '');
                    if (filtered.split('.').length > 2) return;
                    setAmount(filtered);
                  }}
                  keyboardType="decimal-pad"
                  selectionColor="#f48fb1"
                  className="font-manrope font-black text-[#f48fb1] text-center"
                  style={{
                    fontSize: 48,
                    lineHeight: 56,
                    paddingVertical: 0,
                    marginVertical: 0,
                    includeFontPadding: false,
                    minWidth: 140,
                    height: 60,
                  }}
                  maxLength={9}
                />
              </View>

              <View className="flex-row flex-wrap justify-center gap-3">
                {['100', '500', '1,000', '5,000'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setAmount(val.replace(',', ''))}
                    className="px-5 py-2.5 rounded-xl bg-pink-50 border border-pink-100 shadow-sm active:scale-95"
                  >
                    <Text className="text-xs font-manrope font-black text-[#f48fb1]">{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </MotiView>

            {/* Methods Section */}
            <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest px-1 mb-4">
              Payment Method
            </Text>

            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 100 }}
              className="mb-8"
            >
              <View className="flex-row items-center justify-between p-5 rounded-[2rem] mb-4 bg-white border border-pink-200 shadow-md shadow-pink-100">
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-[1.2rem] items-center justify-center bg-pink-50">
                    <Landmark size={20} color="#f48fb1" />
                  </View>
                  <View>
                    <Text className="text-sm font-manrope font-black text-gray-800">
                      SCB Savings Account
                    </Text>
                    <Text className="text-[10px] font-manrope font-bold text-gray-400 mt-1">
                      *** *** 4567
                    </Text>
                  </View>
                </View>
                <View className="w-5 h-5 rounded-full border-[1.5px] items-center justify-center bg-[#f48fb1] border-[#f48fb1]">
                  <CheckCircle2 size={12} color="white" />
                </View>
              </View>
            </MotiView>

            {/* Next Step Button */}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200 }}
            >
              <TouchableOpacity
                disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                onPress={handleNextStep}
                className={`w-full h-16 rounded-2xl flex-row items-center justify-center gap-2 shadow-lg transition-all
                  ${
                    isSubmitting || !amount || parseFloat(amount) <= 0
                      ? 'bg-gray-200 shadow-none'
                      : 'bg-[#f48fb1] shadow-pink-200 active:scale-95'
                  }`}
              >
                <Text
                  className={`font-manrope font-black text-base ${!amount || parseFloat(amount) <= 0 || isSubmitting ? 'text-gray-400' : 'text-white'}`}
                >
                  {isSubmitting ? 'Processing...' : 'Review Top Up'}
                </Text>
                {!isSubmitting && amount && parseFloat(amount) > 0 && (
                  <ArrowRight size={20} color="white" />
                )}
              </TouchableOpacity>
            </MotiView>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
