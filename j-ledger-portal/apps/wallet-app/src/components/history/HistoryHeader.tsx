import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

interface HistoryHeaderProps {
  onBack: () => void;
}

export const HistoryHeader = ({ onBack }: HistoryHeaderProps) => {
  return (
    <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
      <TouchableOpacity
        onPress={onBack}
        className="w-10 h-10 bg-white rounded-2xl items-center justify-center border border-gray-100 shadow-sm"
      >
        <ChevronLeft size={24} color="#1a1a1a" />
      </TouchableOpacity>
      <Text className="text-lg font-black text-gray-800 font-manrope">History</Text>
      <View className="w-10 h-10" />
    </View>
  );
};
