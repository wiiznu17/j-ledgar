import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Search, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '@/store/notifications';

export const HomeHeader = () => {
  const router = useRouter();
  const unreadCount = useNotificationStore((state) => state.getUnreadCount());

  const handleNotificationPress = () => {
    router.push('/notifications' as any);
  };

  return (
    <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
      <View className="w-10 h-10 bg-[#f48fb1] rounded-2xl items-center justify-center mr-3 shadow-sm shadow-pink-200">
        <Text className="text-white font-black text-xl">W</Text>
      </View>
      <View className="flex-1 mr-4">
        <View className="bg-white border border-gray-100 rounded-full px-4 py-3 flex-row items-center shadow-sm">
          <Search size={16} color="#9ca3af" />
          <Text className="text-gray-400 ml-2 text-xs font-manrope font-bold">Search</Text>
        </View>
      </View>
      <TouchableOpacity onPress={handleNotificationPress} className="relative active:opacity-70">
        <Bell size={24} color="#1a1a1a" />
        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full items-center justify-center border-2 border-[#f8f9fe]">
            <Text className="text-[8px] text-white font-black">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};
