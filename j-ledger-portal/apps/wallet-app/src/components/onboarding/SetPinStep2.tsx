import React from 'react';
import { View } from 'react-native';
import { PinPad } from '@/components/common/PinPad';
import { StepWrapper } from '@/components/common/StepWrapper';
import { StepHeader } from './StepHeader';

interface SetPinStep2Props {
  visible: boolean;
  pin: string;
  onPinChange: (v: string) => void;
  onComplete: (pin: string) => void;
  onBack: () => void;
}

export const SetPinStep2: React.FC<SetPinStep2Props> = ({
  visible,
  pin,
  onPinChange,
  onComplete,
  onBack,
}) => (
  <StepWrapper visible={visible}>
    <StepHeader
      title="Confirm Transaction PIN"
      subtitle="Please re-enter your 6-digit PIN to confirm."
      onBack={onBack}
    />
    <View className="mt-4">
      <PinPad pin={pin} setPin={onPinChange} length={6} onComplete={onComplete} />
    </View>
  </StepWrapper>
);
