import React from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { QrCode } from 'lucide-react-native';
import { MotiView } from 'moti';

interface MyDealRowProps {
  id: string;
  title: string;
  expire: string;
  image: any;
  status: string;
  index: number;
  onPressQR: () => void;
  isProcessing?: boolean;
}

export const MyDealRow = ({
  title,
  expire,
  image,
  status,
  index,
  onPressQR,
  isProcessing,
}: MyDealRowProps) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100 }}
      className="bg-white rounded-[2.5rem] p-5 border border-gray-50 shadow-sm flex-row items-center gap-4"
    >
      <Image
        source={typeof image === 'string' ? { uri: image } : image}
        className="w-24 h-24 rounded-3xl"
      />
      <View className="flex-1 py-1">
        <View className="bg-green-50 px-2 py-1 rounded-md self-start mb-2">
          <Text className="text-[8px] font-manrope font-black text-green-500 uppercase tracking-widest">
            {status}
          </Text>
        </View>
        <Text className="text-sm font-manrope font-black text-gray-800 tracking-tight mb-1">
          {title}
        </Text>
        <Text className="text-[10px] font-manrope font-bold text-gray-400 uppercase tracking-widest">
          {expire}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onPressQR}
        disabled={isProcessing}
        className="w-12 h-12 bg-pink-50 rounded-2xl items-center justify-center border border-pink-100 active:scale-95"
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#f48fb1" />
        ) : (
          <QrCode size={20} color="#f48fb1" />
        )}
      </TouchableOpacity>
    </MotiView>
  );
};
