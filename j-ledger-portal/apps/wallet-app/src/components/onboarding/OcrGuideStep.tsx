import React from 'react';
import { View, Text, Image } from 'react-native';
import { AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react-native';
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
      <StepHeader
        title="ID Capture"
        subtitle="We need to scan the front of your National ID Card."
      />

      <View className="w-full aspect-square bg-surfaceVariant/5 rounded-[40px] overflow-hidden my-8 items-center justify-center border border-on-surfaceVariant/5">
        <Image
          source={require('../../../assets/images/register/id_scan_guide.png')}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      <View className="w-full space-y-3 mb-6">
        <View className="flex-row items-center gap-4 bg-primary/5 p-3 rounded-2xl border border-primary/10">
          <Lightbulb size={20} color="#f48fb1" />
          <View className="flex-1">
            <Text className="text-sm font-manrope font-bold text-on-surface">Good Lighting</Text>
            <Text className="text-xs font-manrope text-on-surfaceVariant">
              Avoid glare and shadows on the card
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4 bg-primary/5 p-3 rounded-2xl border border-primary/10">
          <CheckCircle2 size={20} color="#f48fb1" />
          <View className="flex-1">
            <Text className="text-sm font-manrope font-bold text-on-surface">
              Clear and Readable
            </Text>
            <Text className="text-xs font-manrope text-on-surfaceVariant">
              Ensure all text and your photo are in focus
            </Text>
          </View>
        </View>
      </View>

      <AppButton title="Scan National ID" className="w-full" onPress={onScan} />

      <Text className="text-[10px] font-manrope text-center mt-4 text-on-surfaceVariant/60">
        Your data is encrypted and stored securely according to PDPA standards.
      </Text>
    </View>
  </StepWrapper>
);
