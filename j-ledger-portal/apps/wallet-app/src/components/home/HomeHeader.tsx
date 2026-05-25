import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Search, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/auth';

export const HomeHeader = () => {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        const response = await api.get('/notifications', {
          params: { page: 1, limit: 1 },
        });
        return response.data?.meta?.unreadCount ?? 0;
      } catch (err) {
        console.error('[HomeHeader] Failed to fetch unread count:', err);
        return 0;
      }
    },
    refetchInterval: 15000, // Auto refetch every 15s to keep in sync
    enabled: !!token,
  });

  const handleNotificationPress = () => {
    router.push('/notifications' as any);
  };

  return (
    <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
      <View className="w-10 h-10 bg-white rounded-2xl items-center justify-center mr-3 border border-gray-50 p-1.5 shadow-sm">
        <Image
          source={require('../../../assets/images/logo/logo.png')}
          className="w-full h-full"
          resizeMode="contain"
        />
      </View>
      <View className="flex-1 mr-4">
        <View className="bg-white border border-gray-100 rounded-full px-4 py-3 flex-row items-center shadow-sm">
          <Search size={16} color="#9ca3af" />
          <Text className="text-gray-400 ml-2 text-xs font-manrope font-bold">
            Search
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={handleNotificationPress}
        className="relative active:opacity-70"
      >
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
