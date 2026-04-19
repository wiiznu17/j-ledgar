import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { Camera, ShieldCheck,  } from 'lucide-react-native';

export interface UserHeaderCardProps {
  nameTh: string;
  nameEn: string;
  avatar: any;
  phone: string;
  kycTier: string;
}

export function UserHeaderCard({ nameTh, nameEn, avatar, phone, kycTier }: UserHeaderCardProps) {
  // Helper to mask phone: 0812345678 -> 081-XXX-XX78
  const maskPhone = (p: string) => {
    if (!p || p.length < 10) return p;
    return `${p.slice(0, 3)}-XXX-XX${p.slice(8)}`;
  };

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
      <View className="items-center mt-4">
        <Text className="text-2xl font-manrope font-black text-gray-800 tracking-tight">{nameTh}</Text>
        <Text className="text-sm font-bold text-gray-400 mt-0.5">{nameEn}</Text>
        <Text className="text-[11px] font-bold text-gray-400 mt-1">{maskPhone(phone)}</Text>
      </View>
      <View className="flex-row items-center gap-1.5 mt-3 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
        <ShieldCheck size={14} color="#22c55e" />
        <Text className="text-[10px] font-black uppercase tracking-widest text-green-600">
          {kycTier || 'Verified'}
        </Text>
      </View>
    </MotiView>
  );
}
