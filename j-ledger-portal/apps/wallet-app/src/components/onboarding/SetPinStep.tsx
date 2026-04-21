import React from 'react';
import { View } from 'react-native';
import { PinPad } from '@/components/common/PinPad';
import { StepWrapper } from '@/components/common/StepWrapper';
import { StepHeader } from './StepHeader';

interface SetPinStepProps {
  visible: boolean;
  pin: string;
  onPinChange: (v: string) => void;
  onComplete: (pin: string) => void;
}

export const SetPinStep: React.FC<SetPinStepProps> = ({
  visible,
  pin,
  onPinChange,
  onComplete,
}) => (
  <StepWrapper visible={visible}>
    <StepHeader
      title="Set Transaction PIN"
      subtitle="Create a 6-digit PIN to secure your wallet."
    />
    <View className="mt-4">
      <PinPad pin={pin} setPin={onPinChange} length={6} onComplete={onComplete} />
    </View>
  </StepWrapper>
);
