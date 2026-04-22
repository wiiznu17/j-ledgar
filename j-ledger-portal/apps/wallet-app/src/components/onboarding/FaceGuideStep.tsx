import React from 'react';
import { View, Text } from 'react-native';
import { ScanFace } from 'lucide-react-native';
import { AppButton } from '@/components/common/AppButton';
import { StepWrapper } from '@/components/common/StepWrapper';
import { StepHeader } from './StepHeader';

interface FaceGuideStepProps {
  visible: boolean;
  onScan: () => void;
}

export const FaceGuideStep: React.FC<FaceGuideStepProps> = ({ visible, onScan }) => (
  <StepWrapper visible={visible} direction="vertical">
    <View className="items-center">
      <View className="px-6 py-4 bg-primary/5 rounded-2xl border border-primary/10 mb-8 flex-row items-center gap-3">
        <ScanFace size={20} color="#f48fb1" />
        <Text className="text-xs font-manrope font-bold text-primary">
          Biometric data is securely encrypted
        </Text>
      </View>
      <StepHeader
        title="Live Selfie"
        subtitle="Position your face clearly in the frame for a liveness check."
      />
      <AppButton title="Start Face Scan" className="w-full mt-8" onPress={onScan} />
    </View>
  </StepWrapper>
);
