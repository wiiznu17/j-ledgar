import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export function InformationHeader() {
  const router = useRouter();

  return (
    <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
      <TouchableOpacity
        onPress={() => router.back()}
        className="w-10 h-10 bg-white rounded-2xl items-center justify-center border border-gray-100 shadow-sm"
      >
        <ChevronLeft size={24} color="#1a1a1a" />
      </TouchableOpacity>
      <Text className="text-lg font-black text-gray-800 font-manrope">Personal Information</Text>
      <View className="w-10 h-10" />
    </View>
  );
}
