import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Coins } from 'lucide-react-native';

interface AmountTriggerButtonProps {
  amount: string;
  onPress: () => void;
}

export function AmountTriggerButton({ amount, onPress }: AmountTriggerButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-full h-16 bg-white rounded-3xl border border-gray-100 shadow-sm flex-row items-center px-6 mb-6 active:scale-95"
    >
      <View className="w-10 h-10 bg-pink-50 rounded-xl items-center justify-center border border-pink-100 mr-4">
        <Coins size={20} color="#f48fb1" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-manrope font-black text-gray-800">Specify Amount</Text>
        <Text className="text-[10px] font-manrope font-bold text-gray-400">
          {amount ? 'Tap to change amount' : 'Create a QR for a specific amount'}
        </Text>
      </View>
      <View className="bg-pink-50/50 px-3 py-1 rounded-lg">
        <Text className="text-[10px] font-manrope font-black text-[#f48fb1] uppercase">
          {amount ? 'EDIT' : 'ADD'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
