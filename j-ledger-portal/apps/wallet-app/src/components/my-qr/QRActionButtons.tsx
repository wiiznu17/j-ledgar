import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Share2, Download } from 'lucide-react-native';

export function QRActionButtons() {
  return (
    <View className="flex-row gap-4 w-full mb-6">
      <TouchableOpacity className="flex-1 h-14 rounded-2xl bg-white border border-gray-100 items-center justify-center flex-row gap-2 shadow-sm active:scale-95">
        <Share2 size={18} color="#f48fb1" />
        <Text className="text-xs font-manrope font-black text-gray-800 uppercase tracking-widest">
          Share QR
        </Text>
      </TouchableOpacity>
      <TouchableOpacity className="flex-1 h-14 rounded-2xl bg-white border border-gray-100 items-center justify-center flex-row gap-2 shadow-sm active:scale-95">
        <Download size={18} color="#f48fb1" />
        <Text className="text-xs font-manrope font-black text-gray-800 uppercase tracking-widest">
          Save Image
        </Text>
      </TouchableOpacity>
    </View>
  );
}
