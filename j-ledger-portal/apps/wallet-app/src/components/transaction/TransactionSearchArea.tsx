import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, X } from 'lucide-react-native';

interface TransactionSearchAreaProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  onClear: () => void;
  isLoading: boolean;
  error?: string;
}

export const TransactionSearchArea: React.FC<TransactionSearchAreaProps> = ({
  value,
  onChangeText,
  onSearch,
  onClear,
  isLoading,
  error,
}) => {
  return (
    <View className="bg-white rounded-[2.5rem] p-7 border border-gray-100 shadow-sm">
      <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-4 ml-1">
        Search Recipient
      </Text>
      
      <View className="bg-gray-50/80 rounded-2xl px-5 py-4 border border-gray-100 flex-row items-center">
        <TextInput
          placeholder="08X-XXX-XXXX"
          placeholderTextColor="#d1d5db"
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          className="flex-1 font-manrope font-black text-gray-800 text-lg tracking-[0.05em]"
          style={{ paddingVertical: 0 }}
          maxLength={12}
        />
        
        {value.length > 0 && !isLoading && (
          <TouchableOpacity
            onPress={onClear}
            className="w-8 h-8 bg-white border border-gray-100 rounded-full items-center justify-center mr-2 shadow-sm"
          >
            <X size={14} color="#9ca3af" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onSearch}
          disabled={isLoading || value.replace(/\D/g, '').length < 10}
          className={`w-10 h-10 rounded-xl items-center justify-center ${
            value.replace(/\D/g, '').length >= 10 ? 'bg-[#f48fb1]' : 'bg-gray-200'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Search size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
      
      <Text className="text-[10px] font-manrope font-bold text-gray-400 mt-4 ml-1 leading-relaxed">
        Enter the phone number of the person you want to transfer funds to.
      </Text>
    </View>
  );
};
