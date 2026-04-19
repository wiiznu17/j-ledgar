import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft, Scan } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface QRHeaderProps {
  isProcessing?: boolean;
  setIsProcessing?: (val: boolean) => void;
}

export function QRHeader({ isProcessing, setIsProcessing }: QRHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (isProcessing) return;
    setIsProcessing?.(true);
    router.back();
  };

  return (
    <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
      <TouchableOpacity
        onPress={handleBack}
        disabled={isProcessing}
        className={`w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm ${isProcessing ? 'opacity-50' : ''}`}
      >
        <ChevronLeft size={24} color="#1a1a1a" />
      </TouchableOpacity>
      <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
        Receive Assets
      </Text>
      <TouchableOpacity className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
        <Scan size={20} color="#f48fb1" />
      </TouchableOpacity>
    </View>
  );
}
