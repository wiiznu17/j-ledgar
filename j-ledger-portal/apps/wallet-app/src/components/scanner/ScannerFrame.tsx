import React from 'react';
import { View } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { ActivityIndicator } from 'react-native';

interface ScannerFrameProps {
  size: number;
  isProcessing: boolean;
}

export const ScannerFrame: React.FC<ScannerFrameProps> = ({ size, isProcessing }) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        position: 'relative',
      }}
    >
      {/* กรอบมุมทั้ง 4 ด้าน */}
      <View className="absolute top-0 left-0 w-12 h-12 border-t-[5px] border-l-[5px] border-[#f48fb1] rounded-tl-3xl" />
      <View className="absolute top-0 right-0 w-12 h-12 border-t-[5px] border-r-[5px] border-[#f48fb1] rounded-tr-3xl" />
      <View className="absolute bottom-0 left-0 w-12 h-12 border-b-[5px] border-l-[5px] border-[#f48fb1] rounded-bl-3xl" />
      <View className="absolute bottom-0 right-0 w-12 h-12 border-b-[5px] border-r-[5px] border-[#f48fb1] rounded-br-3xl" />

      {/* เส้นเลเซอร์แสกน */}
      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: size - 4 }}
        transition={{ loop: true, type: 'timing', duration: 2500 }}
        className="absolute left-3 right-3 h-[2px] bg-[#f48fb1] shadow-lg shadow-pink-400 z-10"
      />

      {/* Overlay กำลังประมวลผล */}
      <AnimatePresence>
        {isProcessing && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 rounded-3xl items-center justify-center"
          >
            <ActivityIndicator size="large" color="#f48fb1" />
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
};
