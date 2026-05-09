import React from 'react';
import { View, Text, Image } from 'react-native';
import { ScanFace, UserCheck, ShieldCheck, Sun } from 'lucide-react-native';
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
      <StepHeader
        title="Live Selfie"
        subtitle="Position your face clearly in the frame for a liveness check."
      />

      <View className="w-full aspect-square bg-surfaceVariant/5 rounded-[40px] overflow-hidden my-2 items-center justify-center border border-on-surfaceVariant/5">
        <Image
          source={require('../../../assets/images/register/face_scan_guide.png')}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      <View className="w-full space-y-3 mb-6">
        <View className="flex-row items-center gap-4 bg-primary/5 p-3 rounded-2xl border border-primary/10">
          <Sun size={20} color="#f48fb1" />
          <View className="flex-1">
            <Text className="text-sm font-manrope font-bold text-on-surface">Even Lighting</Text>
            <Text className="text-xs font-manrope text-on-surfaceVariant">
              Make sure your face is well-lit and clearly visible
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4 bg-primary/5 p-3 rounded-2xl border border-primary/10">
          <UserCheck size={20} color="#f48fb1" />
          <View className="flex-1">
            <Text className="text-sm font-manrope font-bold text-on-surface">
              Remove Accessories
            </Text>
            <Text className="text-xs font-manrope text-on-surfaceVariant">
              Please remove glasses, hats, or masks
            </Text>
          </View>
        </View>
      </View>

      <AppButton title="Start Face Scan" className="w-full" onPress={onScan} />

      <View className="flex-row items-center gap-2 mt-4 justify-center">
        <ShieldCheck size={12} color="#f48fb1" />
        <Text className="text-[10px] font-manrope text-on-surfaceVariant/60">
          Biometric data is securely encrypted and never shared.
        </Text>
      </View>
    </View>
  </StepWrapper>
);
