import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, FileText } from 'lucide-react-native';

interface HistoryHeaderProps {
  onBack: () => void;
  onExportPress?: () => void;
}

export const HistoryHeader = ({ onBack, onExportPress }: HistoryHeaderProps) => {
  return (
    <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
      <TouchableOpacity
        onPress={onBack}
        className="w-10 h-10 bg-white rounded-2xl items-center justify-center border border-gray-100 shadow-sm"
      >
        <ChevronLeft size={24} color="#1a1a1a" />
      </TouchableOpacity>
      <Text className="text-lg font-black text-gray-800 font-manrope">
        History
      </Text>
      {onExportPress ? (
        <TouchableOpacity
          onPress={onExportPress}
          className="w-10 h-10 bg-white rounded-2xl items-center justify-center border border-gray-100 shadow-sm active:bg-gray-50"
        >
          <FileText size={20} color="#f48fb1" />
        </TouchableOpacity>
      ) : (
        <View className="w-10 h-10" />
      )}
    </View>
  );
};
