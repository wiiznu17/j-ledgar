import React from 'react';
import { View, Text, Modal } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { MotiView } from 'moti';

interface RedemptionSuccessOverlayProps {
  isVisible: boolean;
}

export const RedemptionSuccessOverlay = ({ isVisible }: RedemptionSuccessOverlayProps) => {
  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View className="flex-1 bg-white/95 items-center justify-center p-10">
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-28 h-28 bg-green-50 rounded-[2.5rem] items-center justify-center mb-6 shadow-xl shadow-green-100 border border-green-100"
        >
          <CheckCircle2 size={48} color="#22c55e" />
        </MotiView>
        <MotiView
          from={{ translateY: 20, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ delay: 200 }}
        >
          <Text className="text-3xl font-manrope font-black text-gray-800 tracking-tight text-center">
            Redeemed!
          </Text>
          <Text className="text-base font-manrope font-bold text-gray-400 mt-3 text-center leading-relaxed">
            Added to your My Deals.{'\n'}Redirecting...
          </Text>
        </MotiView>
      </View>
    </Modal>
  );
};
