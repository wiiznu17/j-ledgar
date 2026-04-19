import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ArrowRight, ShieldCheck, Wallet, UserCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';

const { width } = Dimensions.get('window');

export default function ReviewTransferScreen() {
  const router = useRouter();
  const { recipient, amount, note } = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);

  const transferAmount = parseFloat(amount as string) || 0;
  const fee = 0;
  const totalAmount = transferAmount + fee;

  const handleConfirm = () => {
    setIsProcessing(true);
    // Mock Gateway Delay
    setTimeout(() => {
      setIsProcessing(false);
      router.push({
        pathname: '/transfer/success',
        params: { recipient, amount, note },
      } as any);
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => !isProcessing && router.back()}
          className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
          Review Transfer
        </Text>
        <View className="w-10" />
      </View>

      {/* เพิ่ม paddingBottom เผื่อพื้นที่ให้ Action Area ลอยอยู่ด้านล่าง */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="mt-2"
        >
          {/* Main Review Card */}
          <View className="bg-white rounded-[2.5rem] p-7 border border-gray-50 shadow-xl shadow-pink-100/40 relative overflow-hidden mb-6">
            <View className="absolute top-0 left-0 right-0 h-2 bg-[#f48fb1]" />

            <View className="items-center mb-8 pt-4">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-3">
                Transfer Amount
              </Text>
              <View className="flex-row items-baseline w-full justify-center">
                <Text className="text-2xl font-manrope font-black text-gray-400 mr-2">฿</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                  className="text-5xl font-manrope font-black text-gray-800 tracking-tighter"
                >
                  {transferAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>

            {/* Transfer Direction Container */}
            <View className="bg-gray-50/80 rounded-[2rem] p-5 border border-gray-100/50 mb-8 relative">
              {/* Connector Line (ใช้วิธี Absolute เพื่อไม่ให้รบกวน Layout อื่น) */}
              <View className="absolute left-10 top-12 bottom-12 w-[2px] bg-gray-200 border-dashed border-l-[2px] border-gray-200 z-0" />

              {/* From User */}
              <View className="flex-row items-center relative z-10 mb-6">
                <View className="w-10 h-10 bg-white rounded-xl items-center justify-center shadow-sm border border-gray-100">
                  <Wallet size={20} color="#9ca3af" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-0.5">
                    From
                  </Text>
                  <Text className="text-sm font-manrope font-black text-gray-800">My E-Wallet</Text>
                </View>
              </View>

              {/* To User */}
              <View className="flex-row items-center relative z-10">
                <View className="w-10 h-10 bg-pink-50 rounded-xl items-center justify-center border border-pink-100 shadow-sm">
                  <UserCircle size={20} color="#f48fb1" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-0.5">
                    To Recipient
                  </Text>
                  <Text className="text-sm font-manrope font-black text-gray-800" numberOfLines={1}>
                    {recipient}
                  </Text>
                </View>
              </View>
            </View>

            {/* Summary Board */}
            <View className="space-y-4">
              <SummaryRow label="Transaction Type" value="Peer-to-Peer" />
              <SummaryRow label="Transfer Fee" value="FREE" isHighlight />
              {note ? <SummaryRow label="Note" value={note as string} /> : null}

              <View className="mt-2 pt-5 border-t border-gray-100 flex-row justify-between items-center">
                <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest">
                  Total Payment
                </Text>
                <Text className="text-xl font-manrope font-black text-[#f48fb1]">
                  ฿{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>

          {/* Trust Banner */}
          <View className="bg-green-50/50 p-5 rounded-2xl border border-green-100/50 flex-row items-center gap-4 shadow-sm mb-4">
            <View className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-green-100">
              <ShieldCheck size={20} color="#22c55e" />
            </View>
            <Text className="text-[10px] font-manrope font-bold text-green-700/80 uppercase tracking-widest flex-1 leading-relaxed">
              Guaranteed by J-Ledger Security Standard
            </Text>
          </View>
        </MotiView>
      </ScrollView>

      {/* Floating Action Area */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-8 bg-white/90 border-t border-gray-50"
        style={{ paddingBottom: Platform.OS === 'ios' ? 34 : 24 }} // จัดการ Safe Area ของ iPhone
      >
        <TouchableOpacity
          disabled={isProcessing}
          onPress={handleConfirm}
          className={`w-full h-16 rounded-2xl flex-row items-center justify-center gap-3 transition-all ${
            isProcessing ? 'bg-pink-300' : 'bg-[#f48fb1] shadow-lg shadow-pink-200 active:scale-95'
          }`}
        >
          {isProcessing ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="font-manrope font-black text-white text-base">Confirm Transfer</Text>
              <ArrowRight size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Processing Portal */}
      <AnimatePresence>
        {isProcessing && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 items-center justify-center z-50 p-10"
          >
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-pink-50 rounded-[2.5rem] items-center justify-center border border-pink-100 mb-8 shadow-2xl shadow-pink-100"
            >
              <ActivityIndicator size="large" color="#f48fb1" />
            </MotiView>
            <Text className="text-2xl font-manrope font-black text-gray-800 tracking-tight text-center">
              Encrypting Transaction
            </Text>
            <Text className="text-sm font-manrope font-bold text-gray-400 mt-3 text-center leading-relaxed">
              We're verifying your identities and securing the ledger connection...
            </Text>
          </MotiView>
        )}
      </AnimatePresence>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  isHighlight,
}: {
  label: string;
  value: string;
  isHighlight?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest">
        {label}
      </Text>
      <Text
        className={`text-sm font-manrope font-black ${
          isHighlight ? 'text-green-500' : 'text-gray-800'
        }`}
      >
        {value}
      </Text>
    </View>
  );
}
