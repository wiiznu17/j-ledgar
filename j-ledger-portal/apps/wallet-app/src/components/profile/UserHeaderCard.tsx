import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { Camera, ShieldCheck } from 'lucide-react-native';

export interface UserHeaderCardProps {
  name: string;
  avatar: any;
}

export function UserHeaderCard({ name, avatar }: UserHeaderCardProps) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="items-center py-6 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm mb-3 mt-2"
    >
      <View className="relative">
        <View className="p-1 border-2 border-pink-100 rounded-[2.5rem]">
          <Image source={avatar} className="w-24 h-24 rounded-[2.2rem]" />
        </View>
        <TouchableOpacity className="absolute -bottom-2 -right-2 w-9 h-9 bg-[#f48fb1] rounded-full items-center justify-center border-4 border-white shadow-sm">
          <Camera size={16} color="white" />
        </TouchableOpacity>
      </View>
      <Text className="text-2xl font-manrope font-black text-gray-800 mt-4">{name}</Text>
      <View className="flex-row items-center gap-1.5 mt-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
        <ShieldCheck size={14} color="#22c55e" />
        <Text className="text-[10px] font-black uppercase tracking-widest text-green-600">
          KYC Verified
        </Text>
      </View>
    </MotiView>
  );
}
