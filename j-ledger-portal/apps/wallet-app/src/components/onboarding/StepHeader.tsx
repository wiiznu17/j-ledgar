import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

interface StepHeaderProps {
  title: string;
  subtitle: string;
  onBack?: () => void;
}

export const StepHeader: React.FC<StepHeaderProps> = ({ title, subtitle, onBack }) => (
  <View className="mb-10">
    {onBack && (
      <TouchableOpacity
        onPress={onBack}
        className="w-12 h-12 rounded-2xl bg-white/60 border border-outline-variant flex items-center justify-center mb-6 shadow-sm"
      >
        <ChevronLeft size={24} color="#2c2f33" />
      </TouchableOpacity>
    )}
    <Text className="text-3xl font-manrope font-extrabold tracking-tight text-on-surface mb-2 leading-tight">
      {title}
    </Text>
    <Text className="text-on-surfaceVariant text-sm font-manrope font-medium leading-relaxed">
      {subtitle}
    </Text>
  </View>
);
