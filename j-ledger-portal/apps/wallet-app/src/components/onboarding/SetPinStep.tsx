import React from 'react';
import { View } from 'react-native';
import { PINInput } from '@/components/common/PINInput';
import { PINLayout } from '@/components/common/PINLayout';
import { StepWrapper } from '@/components/common/StepWrapper';

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
    <PINLayout
      title="Set Transaction PIN"
      subtitle="Create a 6-digit PIN to secure your wallet."
    >
      <PINInput
        pin={pin}
        onPinChange={onPinChange}
        length={6}
        onComplete={onComplete}
      />
    </PINLayout>
  </StepWrapper>
);
