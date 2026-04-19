import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RedemptionConfirmationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  points: number;
  dealTitle: string;
  isProcessing: boolean;
}

export const RedemptionConfirmationModal = ({
  isVisible,
  onClose,
  onConfirm,
  points,
  dealTitle,
  isProcessing,
}: RedemptionConfirmationModalProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={isVisible} transparent animationType="none">
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <AnimatePresence>
          {isVisible && (
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40"
            />
          )}
        </AnimatePresence>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => !isProcessing && onClose()}
          className="absolute inset-0"
        />

        {/* Sheet */}
        <MotiView
          from={{ translateY: 600 }}
          animate={{ translateY: 0 }}
          exit={{ translateY: 600 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="bg-white rounded-t-[2.5rem] p-8 shadow-2xl"
          style={{ paddingBottom: Math.max(insets.bottom, 32) }}
        >
          {/* Grabber Pill */}
          <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />

          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-manrope font-black text-gray-800 tracking-tight">
              Confirm Redeem
            </Text>
            <TouchableOpacity
              onPress={() => !isProcessing && onClose()}
              className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
            >
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View className="bg-pink-50/50 p-6 rounded-[2rem] border border-pink-100 mb-8 items-center">
            <Text className="text-[10px] font-manrope font-black text-pink-400 uppercase tracking-[0.2em] mb-2">
              Points to Deduct
            </Text>
            <Text className="text-5xl font-manrope font-black text-[#f48fb1] tracking-tighter">
              {points.toLocaleString()}
            </Text>
            <View className="h-px w-full bg-pink-100/50 my-5" />
            <Text className="text-xs font-manrope font-bold text-gray-500 text-center leading-relaxed">
              You are about to redeem <Text className="font-black text-gray-700">{dealTitle}</Text>.
            </Text>
          </View>

          <View className="flex-row gap-4">
            <TouchableOpacity
              onPress={onClose}
              disabled={isProcessing}
              className="flex-1 h-16 bg-gray-50 border border-gray-100 rounded-2xl items-center justify-center active:scale-95"
            >
              <Text className="font-manrope font-black text-gray-500">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              disabled={isProcessing}
              className="flex-[2] h-16 bg-[#f48fb1] rounded-2xl items-center justify-center shadow-lg shadow-pink-200 active:scale-95"
            >
              {isProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="font-manrope font-black text-white text-base">Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};
