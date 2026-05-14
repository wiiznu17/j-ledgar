import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { X, Lightbulb } from 'lucide-react-native';

interface ScannerControlsProps {
  topInset: number;
  torch: boolean;
  onClose: () => void;
  onToggleTorch: () => void;
}

export const ScannerControls: React.FC<ScannerControlsProps> = ({
  topInset,
  torch,
  onClose,
  onToggleTorch,
}) => {
  return (
    <View
      className="absolute top-0 w-full flex-row justify-between px-6"
      style={{ paddingTop: Math.max(topInset, 20) + 10 }}
    >
      <TouchableOpacity
        onPress={onClose}
        className="w-12 h-12 rounded-[1.2rem] bg-[#1a1a1a]/80 items-center justify-center border border-white/20 active:scale-95"
      >
        <X size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onToggleTorch}
        className={`w-12 h-12 rounded-[1.2rem] items-center justify-center border border-white/20 active:scale-95 transition-all ${
          torch ? 'bg-[#f48fb1]' : 'bg-[#1a1a1a]/80'
        }`}
      >
        <Lightbulb size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
};
