import { PINInput } from '@/components/common/PINInput';
import { PINLayout, PINBackButton } from '@/components/common/PINLayout';
import { StepWrapper } from '@/components/common/StepWrapper';

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
    <PINLayout
      title="Confirm Transaction PIN"
      subtitle="Please re-enter your 6-digit PIN to confirm."
      leftElement={<PINBackButton onPress={onBack} />}
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
