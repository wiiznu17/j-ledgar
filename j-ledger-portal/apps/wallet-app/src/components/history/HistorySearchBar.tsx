import React from 'react';
import { View, TextInput } from 'react-native';
import { Search } from 'lucide-react-native';

interface HistorySearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const HistorySearchBar = ({ value, onChangeText }: HistorySearchBarProps) => {
  return (
    <View className="px-5 pb-6">
      <View className="bg-white rounded-full px-4 py-3.5 flex-row items-center border border-gray-100 shadow-sm">
        <Search size={18} color="#9ca3af" />
        <TextInput
          placeholder="Search history..."
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChangeText}
          className="flex-1 ml-3 font-manrope font-bold text-gray-800 text-sm"
          style={{ paddingVertical: 0 }}
        />
      </View>
    </View>
  );
};
