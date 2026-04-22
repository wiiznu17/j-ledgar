import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Copy, Zap, Coins } from 'lucide-react-native';
import { Svg, Polyline } from 'react-native-svg';

interface QRCardProps {
  name: string;
  walletId: string;
  avatar: any;
  qrUrl: string;
  amount: string;
}

export function QRCard({ name, walletId, avatar, qrUrl, amount }: QRCardProps) {
  return (
    <View className="w-full bg-white rounded-[2.5rem] p-8 items-center mb-6 shadow-xl shadow-pink-100 border border-gray-50">
      <View className="relative mb-5">
        <View className="p-1 border-2 border-pink-100 rounded-[1.8rem]">
          <Image source={avatar} className="w-16 h-16 rounded-[1.5rem]" />
        </View>
        <View className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white items-center justify-center shadow-sm">
          <CheckIcon size={12} color="white" strokeWidth={3} />
        </View>
      </View>

      <Text className="text-xl font-manrope font-black text-gray-800 mb-1 tracking-tight">
        {name}
      </Text>
      <View className="flex-row items-center gap-2 mb-8">
        <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-[0.2em]">
          {walletId}
        </Text>
        <TouchableOpacity className="bg-pink-50 px-2 py-1.5 rounded-lg border border-pink-100">
          <Copy size={12} color="#f48fb1" />
        </TouchableOpacity>
      </View>

      {/* QR Code Container */}
      <View className="w-64 h-64 bg-[#f8f9fe] rounded-[2.5rem] items-center justify-center p-6 shadow-inner border border-gray-100 relative">
        <Image source={{ uri: qrUrl }} className="w-full h-full" resizeMode="contain" />
        {/* Logo Overlay */}
        <View className="absolute bg-white p-2 rounded-2xl shadow-md border border-gray-50">
          <View className="w-8 h-8 rounded-xl bg-[#f48fb1] items-center justify-center">
            <Zap size={16} color="white" fill="white" />
          </View>
        </View>
      </View>

      {amount ? (
        <View className="mt-8 px-5 py-2.5 bg-pink-50 rounded-2xl border border-pink-100 flex-row items-center gap-2">
          <Coins size={14} color="#f48fb1" />
          <Text className="text-[14px] font-manrope font-black text-[#f48fb1]">
            Amount: ฿{amount.replace(/\B(?=(\d{3})+(?!\d))/g, ', ')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function CheckIcon({ size, color, strokeWidth }: any) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}
