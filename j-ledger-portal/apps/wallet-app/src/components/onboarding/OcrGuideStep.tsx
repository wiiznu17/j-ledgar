import React from 'react';
import { View, Text } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { AppButton } from '@/components/common/AppButton';
import { StepWrapper } from '@/components/common/StepWrapper';
import { StepHeader } from './StepHeader';

interface OcrGuideStepProps {
  visible: boolean;
  onScan: () => void;
}

export const OcrGuideStep: React.FC<OcrGuideStepProps> = ({ visible, onScan }) => (
  <StepWrapper visible={visible} direction="vertical">
    <View className="items-center">
      <View className="px-6 py-4 bg-yellow-50 rounded-2xl border border-yellow-200 mb-8 flex-row items-center gap-3">
        <AlertCircle size={20} color="#eab308" />
        <Text className="text-xs font-manrope font-bold text-yellow-800">
          Ensure good lighting without glare
        </Text>
      </View>
      <StepHeader
        title="ID Capture"
        subtitle="We need to scan the front of your National ID Card."
      />
      <AppButton title="Scan National ID" className="w-full mt-8" onPress={onScan} />
    </View>
  </StepWrapper>
);
