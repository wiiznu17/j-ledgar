import React from 'react';
import { View, Text, Image } from 'react-native';
import { AppButton } from '@/components/common/AppButton';
import { StepWrapper } from '@/components/common/StepWrapper';

interface SuccessStepProps {
  visible: boolean;
  onEnterWallet: () => void;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({ visible, onEnterWallet }) => (
  <StepWrapper visible={visible}>
    <View className="flex-1 items-center justify-center min-h-[500]">
      <Image
        source={require('../../../assets/images/onboarding_success_1776536303717.png')}
        className="w-56 h-56 mb-8"
      />
      <Text className="text-3xl font-manrope font-black text-center mb-4">
        Registration Validated!
      </Text>
      <Text className="text-on-surfaceVariant text-center mb-12">
        Your account is active and device is securely bound.
      </Text>
      <AppButton title="Enter Wallet" className="w-full" onPress={onEnterWallet} />
    </View>
  </StepWrapper>
);
