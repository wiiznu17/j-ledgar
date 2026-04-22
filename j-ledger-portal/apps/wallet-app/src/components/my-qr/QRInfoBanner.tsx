import React from 'react';
import { View, Text } from 'react-native';
import { Info } from 'lucide-react-native';

export function QRInfoBanner() {
  return (
    <View className="bg-white rounded-2xl p-5 flex-row items-center gap-4 border border-gray-50 shadow-sm mb-10">
      <View className="w-10 h-10 bg-pink-50 rounded-xl items-center justify-center border border-pink-100">
        <Info size={20} color="#f48fb1" />
      </View>
      <Text className="text-[10px] font-manrope font-bold text-gray-500 leading-relaxed flex-1">
        Your unique J-Ledger ID allows instant peer-to-peer asset transfers. Scanning this QR will
        autofill your details.
      </Text>
    </View>
  );
}
