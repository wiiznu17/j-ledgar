import React from 'react';
import { View, Text, TouchableOpacity, Image, TextInput } from 'react-native';
import { Bell, Search, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  showNoti?: boolean;
}

export function Header({
  title,
  showBack,
  onBack,
  showSearch = true,
  showNoti = true,
}: HeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between px-4 py-4 bg-white/80 backdrop-blur-md border-b border-outline-variant/10">
      {/* Back Button / Logo Section */}
      <View className="flex-row items-center shrink-0">
        {showBack ? (
          <TouchableOpacity onPress={onBack || (() => router.back())} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#595b61" />
          </TouchableOpacity>
        ) : (
          <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center shadow-lg shadow-primary/20">
            <Text className="text-white font-manrope font-black text-xl">W</Text>
          </View>
        )}
        {title && (
          <Text className="ml-3 font-manrope font-bold text-base text-on-surface">{title}</Text>
        )}
      </View>

      {/* Search Bar - Integrated in Header */}
      {showSearch && (
        <View className="flex-1 mx-3 bg-[#f5f6fc] rounded-full h-11 px-4 flex-row items-center gap-2 border border-outline-variant/5">
          <Search size={16} color="#abb1b2" />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#abb1b2"
            className="flex-1 font-manrope text-sm text-on-surface p-0"
          />
        </View>
      )}

      {!showSearch && <View className="flex-1" />}

      {/* Action Icons */}
      {showNoti && (
        <View className="flex-row items-center shrink-0">
          <TouchableOpacity
            onPress={() => router.push('/notifications' as any)}
            className="p-2 relative"
          >
            <Bell size={24} color="#595b61" />
            <View className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white items-center justify-center">
              <Text className="text-white text-[8px] font-bold">13</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
