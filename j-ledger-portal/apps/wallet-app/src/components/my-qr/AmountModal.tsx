import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { MotiView } from 'moti';

interface AmountModalProps {
  isVisible: boolean;
  onClose: () => void;
  tempAmount: string;
  setTempAmount: (amount: string) => void;
  onConfirm: () => void;
}

export function AmountModal({
  isVisible,
  onClose,
  tempAmount,
  setTempAmount,
  onConfirm,
}: AmountModalProps) {
  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        {/* Backdrop */}
        <View className="absolute inset-0 bg-black/40" />
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="absolute inset-0"
        />

        {/* Sheet */}
        <MotiView
          from={{ translateY: 400 }}
          animate={{ translateY: isVisible ? 0 : 400 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 200,
            overshootClamping: true,
          }}
          className="bg-white rounded-t-[2.5rem] p-8 pb-12 shadow-2xl"
        >
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-2xl font-manrope font-black text-gray-800">
                Specify Amount
              </Text>
              <Text className="text-[11px] font-manrope font-bold text-gray-400 uppercase tracking-[0.15em] mt-1">
                Enter receiving amount
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
            >
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View className="bg-gray-50 rounded-[2rem] p-10 mb-8 border border-gray-100 items-center justify-center">
            <View className="flex-row items-center justify-center border-b-2 border-pink-100 pb-2 w-full max-w-[280px]">
              <Text className="text-3xl font-manrope font-black text-gray-400 mr-2 mt-1">฿</Text>
              
              <TextInput
                autoFocus
                value={tempAmount}
                onChangeText={(text) => {
                  const filtered = text.replace(/[^0-9.]/g, '');
                  const parts = filtered.split('.');
                  if (parts.length > 2) return;
                  setTempAmount(filtered);
                }}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#d1d5db"
                selectionColor="#f48fb1"
                className="font-manrope font-black text-[#f48fb1] text-center"
                style={{
                  fontSize: 56,
                  lineHeight: 64,
                  paddingVertical: 0,
                  marginVertical: 0,
                  includeFontPadding: false,
                  minWidth: 160,
                  height: 80,
                }}
                maxLength={9}
              />
            </View>
            <Text className="text-[11px] font-manrope font-bold text-gray-400 mt-6 tracking-wide text-center">
              Leave blank for any amount
            </Text>
          </View>

          <TouchableOpacity
            onPress={onConfirm}
            className="w-full h-16 bg-[#f48fb1] rounded-2xl items-center justify-center flex-row gap-3 shadow-lg shadow-pink-200 active:scale-95"
          >
            <Check size={20} color="white" strokeWidth={3} />
            <Text className="text-white font-manrope font-black text-base">Generate QR</Text>
          </TouchableOpacity>
        </MotiView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
