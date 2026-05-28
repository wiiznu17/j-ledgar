import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ScannerOverlayProps {
  frameSize: number;
  children: React.ReactNode;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  frameSize,
  children,
}) => {
  return (
    <View
      style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]}
      pointerEvents="none"
    >
      {/* Top Mask */}
      <View
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }}
        className="items-center justify-end pb-8"
      >
        <View className="items-center gap-2">
          <View className="bg-black/60 px-5 py-2.5 rounded-full border border-white/20">
            <Text className="text-white font-manrope font-bold text-xs tracking-widest uppercase">
              Position QR Code in Frame
            </Text>
          </View>
          <View className="bg-black/40 px-4 py-1.5 rounded-full">
            <Text className="text-white/70 font-manrope text-[10px]">
              Supports: P-Wallet QR only
            </Text>
          </View>
        </View>
      </View>

      {/* Center Row (ซ้าย - กล่องสแกน - ขวา) */}
      <View className="flex-row" style={{ height: frameSize }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }} />
        {children}
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }} />
      </View>

      {/* Bottom Mask */}
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' }} />
    </View>
  );
};
