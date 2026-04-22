import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Share2, Download } from 'lucide-react-native';

interface QRActionButtonsProps {
  isProcessing?: boolean;
  setIsProcessing?: (val: boolean) => void;
}

export function QRActionButtons({ isProcessing, setIsProcessing }: QRActionButtonsProps) {
  const handleAction = (type: 'share' | 'save') => {
    if (isProcessing) return;
    setIsProcessing?.(true);

    // Mock processing delay for visual feedback
    setTimeout(() => {
      setIsProcessing?.(false);
      // In a real app, logic for sharing/saving would go here
    }, 1200);
  };

  return (
    <View className="flex-row gap-4 w-full mb-6">
      <TouchableOpacity
        disabled={isProcessing}
        onPress={() => handleAction('share')}
        className={`flex-1 h-14 rounded-2xl bg-white border border-gray-100 items-center justify-center flex-row gap-2 shadow-sm active:scale-95 ${isProcessing ? 'opacity-70' : ''}`}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#f48fb1" />
        ) : (
          <>
            <Share2 size={18} color="#f48fb1" />
            <Text className="text-xs font-manrope font-black text-gray-800 uppercase tracking-widest">
              Share QR
            </Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        disabled={isProcessing}
        onPress={() => handleAction('save')}
        className={`flex-1 h-14 rounded-2xl bg-white border border-gray-100 items-center justify-center flex-row gap-2 shadow-sm active:scale-95 ${isProcessing ? 'opacity-70' : ''}`}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#f48fb1" />
        ) : (
          <>
            <Download size={18} color="#f48fb1" />
            <Text className="text-xs font-manrope font-black text-gray-800 uppercase tracking-widest">
              Save Image
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
