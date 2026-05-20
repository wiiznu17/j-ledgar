import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image as ImageIcon, QrCode } from 'lucide-react-native';

interface ScannerMenuProps {
  bottomInset: number;
  onPickImage: () => void;
  onShowMyQr: () => void;
}

export const ScannerMenu: React.FC<ScannerMenuProps> = ({
  bottomInset,
  onPickImage,
  onShowMyQr,
}) => {
  return (
    <>
      {/* Supported Format Hint */}
      <View
        className="absolute w-full items-center"
        style={{ bottom: Math.max(bottomInset, 20) + 160 }}
      >
        <View className="bg-[#1a1a1a]/60 px-4 py-2 rounded-full border border-white/10">
          <Text className="text-white/50 font-manrope text-[10px]">
            Only JLEDGER QR codes are supported
          </Text>
        </View>
      </View>

      {/* Bottom Menu */}
      <View
        className="absolute w-full items-center"
        style={{ bottom: Math.max(bottomInset, 20) + 120 }}
      >
        <View className="flex-row items-center bg-[#1a1a1a]/90 px-8 py-4 rounded-[2rem] border border-white/10 shadow-2xl">
          <TouchableOpacity
            onPress={onPickImage}
            className="items-center mr-8 active:scale-95"
          >
            <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mb-1">
              <ImageIcon size={22} color="white" />
            </View>
            <Text className="text-white/90 text-[10px] font-manrope font-bold uppercase tracking-widest mt-1">
              Gallery
            </Text>
          </TouchableOpacity>

          {/* เส้นคั่นกลาง */}
          <View className="w-[1px] h-12 bg-white/20" />

          <TouchableOpacity
            onPress={onShowMyQr}
            className="items-center ml-8 active:scale-95"
          >
            <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mb-1">
              <QrCode size={22} color="white" />
            </View>
            <Text className="text-white/90 text-[10px] font-manrope font-bold uppercase tracking-widest mt-1">
              My QR
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};
