import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';

interface PointsBalanceCardProps {
  points: number;
  onMyDealsPress: () => void;
}

export const PointsBalanceCard = ({ points, onMyDealsPress }: PointsBalanceCardProps) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-sm mb-8 overflow-hidden relative"
    >
      <View className="absolute -top-10 -right-10 w-32 h-32 bg-pink-50 rounded-full opacity-60" />
      <View className="flex-row items-center justify-between relative z-10">
        <View className="flex-1">
          <Text className="text-[#f48fb1] font-manrope font-black text-3xl mb-1 tracking-tighter">
            {points.toLocaleString()} <Text className="text-sm">pts</Text>
          </Text>
          <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest">
            Available Points
          </Text>
        </View>
        <TouchableOpacity
          onPress={onMyDealsPress}
          className="bg-[#f48fb1] px-6 py-3 rounded-2xl shadow-lg shadow-pink-200 active:scale-95"
        >
          <Text className="text-white font-manrope font-black text-[10px] uppercase tracking-widest">
            My Deals
          </Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
};
