import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, Gift } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface DealHeaderProps {
  title: string;
  showBack?: boolean;
  showGift?: boolean;
  onBackPress?: () => void;
  onGiftPress?: () => void;
}

export const DealHeader = ({
  title,
  showBack = false,
  showGift = false,
  onBackPress,
  onGiftPress,
}: DealHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) onBackPress();
    else router.back();
  };

  return (
    <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
      {showBack ? (
        <TouchableOpacity
          onPress={handleBack}
          className="w-10 h-10 bg-white rounded-2xl items-center justify-center border border-gray-100 shadow-sm"
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
      ) : (
        <View className="w-10 h-10" />
      )}

      <Text className="text-lg font-black text-gray-800 font-manrope">{title}</Text>

      {showGift ? (
        <TouchableOpacity
          onPress={onGiftPress}
          className="w-10 h-10 bg-pink-50 rounded-2xl items-center justify-center border border-pink-100 shadow-sm"
        >
          <Gift size={20} color="#f48fb1" />
        </TouchableOpacity>
      ) : (
        <View className="w-10 h-10" />
      )}
    </View>
  );
};
