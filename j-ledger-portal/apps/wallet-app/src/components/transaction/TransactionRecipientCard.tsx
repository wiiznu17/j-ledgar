import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Store, User } from 'lucide-react-native';

interface TransactionRecipientCardProps {
  name: string;
  subtitle?: string;
  type: 'merchant' | 'user';
  onClear?: () => void;
}

export const TransactionRecipientCard: React.FC<
  TransactionRecipientCardProps
> = ({ name, subtitle, type, onClear }) => {
  return (
    <View className="bg-white rounded-[2.5rem] p-6 border border-gray-100 flex-row items-center shadow-sm">
      <View
        className={`w-16 h-16 rounded-[1.5rem] items-center justify-center border ${
          type === 'merchant'
            ? 'bg-pink-50 border-pink-100'
            : 'bg-gray-50 border-gray-100'
        }`}
      >
        {type === 'merchant' ? (
          <Store size={32} color="#f48fb1" />
        ) : (
          <User size={32} color="#9ca3af" />
        )}
      </View>

      <View className="ml-4 flex-1">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-1">
              {type === 'merchant' ? 'Paying To Merchant' : 'Recipient'}
            </Text>
            <Text
              className="text-xl font-manrope font-black text-gray-800"
              numberOfLines={1}
            >
              {name || 'Loading...'}
            </Text>
            {subtitle && (
              <Text
                className="text-xs font-manrope font-bold text-gray-400"
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {onClear && (
            <TouchableOpacity
              onPress={onClear}
              className="px-3 py-1 bg-gray-50 rounded-full border border-gray-100 ml-2"
            >
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase">
                Change
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};
