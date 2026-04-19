import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { ArrowLeftRight, PlusCircle, QrCode, Star, ChevronRight } from 'lucide-react-native';

interface DashboardSectionProps {
  balance: number;
  points: number;
  currency: string;
  onTransfer: () => void;
  onTopUp: () => void;
  onMyQR: () => void;
  onHistory: () => void;
  onRedeem: () => void;
}

export const DashboardSection = ({
  balance,
  points,
  currency,
  onTransfer,
  onTopUp,
  onMyQR,
  onHistory,
  onRedeem,
}: DashboardSectionProps) => {
  return (
    <View className="gap-y-4 mb-4">
      {/* Wallet Card */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        className="relative rounded-[2rem] bg-white overflow-hidden p-6 shadow-xl shadow-pink-100 border border-gray-50"
      >
        {/* Background Glow */}
        <View className="absolute -top-12 -right-12 w-48 h-48 bg-pink-50 rounded-full opacity-80" />

        <View className="space-y-6">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-[#f48fb1]" />
              <Text className="text-[10px] font-manrope font-black uppercase tracking-[0.2em] text-gray-400">
                Active Balance
              </Text>
            </View>
            <TouchableOpacity
              onPress={onHistory}
              className="flex-row items-center gap-1 bg-pink-50 px-3 py-1.5 rounded-full"
            >
              <Text className="text-[10px] font-manrope font-black text-[#f48fb1] uppercase tracking-wide">
                History
              </Text>
              <ChevronRight size={12} color="#f48fb1" />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-between items-end gap-2">
            <View className="flex-1 flex-row items-baseline">
              <Text className="text-2xl font-manrope font-black text-gray-800 mr-1">
                {currency}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                className="text-5xl font-manrope font-black text-gray-800 tracking-tighter leading-[60px] pt-1"
                style={{
                  includeFontPadding: false, // ปรับแต่งพิเศษสำหรับ Android
                }}
              >
                {balance.toLocaleString()}
              </Text>
              <Text className="text-xl font-manrope font-black text-gray-400">.00</Text>
            </View>

            <TouchableOpacity
              onPress={onTransfer}
              style={{ flexShrink: 0 }}
              className="bg-[#f48fb1] px-5 py-3 rounded-2xl flex-row items-center gap-2 shadow-lg shadow-pink-200 active:scale-95"
            >
              <ArrowLeftRight size={16} color="white" strokeWidth={3} />
              <Text className="text-white font-manrope font-bold text-sm">Transfer</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3 pt-2">
            <TouchableOpacity
              onPress={onTopUp}
              className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-50 border border-gray-100"
            >
              <PlusCircle size={18} color="#f48fb1" />
              <Text className="text-gray-700 font-manrope font-bold text-xs">Top up</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onMyQR}
              className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-50 border border-gray-100"
            >
              <QrCode size={18} color="#f48fb1" />
              <Text className="text-gray-700 font-manrope font-bold text-xs">My QR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </MotiView>

      {/* Points Card */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 100 }}
        className="bg-white rounded-[1.8rem] p-5 flex-row items-center justify-between border border-gray-50 shadow-sm"
      >
        <View className="flex-row items-center gap-4">
          <View className="w-12 h-12 rounded-full bg-pink-50 items-center justify-center">
            <Star size={24} color="#f48fb1" fill="#f48fb140" />
          </View>
          <View>
            <Text className="text-[10px] font-manrope font-black uppercase tracking-[0.2em] text-gray-400">
              Reward Points
            </Text>
            <Text className="text-xl font-manrope font-black text-gray-800 mt-0.5">
              {points.toLocaleString()} <Text className="text-sm font-bold text-gray-400">pts</Text>
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onRedeem}
          className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100"
        >
          <Text className="text-[10px] font-manrope font-black text-[#f48fb1] uppercase tracking-widest">
            Redeem
          </Text>
        </TouchableOpacity>
      </MotiView>
    </View>
  );
};
