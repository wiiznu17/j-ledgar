import React from 'react';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { StepWrapper } from '@/components/common/StepWrapper';
import { StepHeader } from './StepHeader';

interface PhoneInputStepProps {
  visible: boolean;
  phone: string;
  isLoading: boolean;
  onPhoneChange: (val: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const PhoneInputStep: React.FC<PhoneInputStepProps> = ({
  visible,
  phone,
  isLoading,
  onPhoneChange,
  onSubmit,
  onBack,
}) => {
  const formatPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  return (
    <StepWrapper visible={visible}>
      <StepHeader
        title="Enter Phone"
        subtitle="We will send a code to verify your identity."
        onBack={onBack}
      />
      <AppTextInput
        label="Mobile Number"
        placeholder="08X-XXX-XXXX"
        value={formatPhone(phone)}
        onChangeText={(val) => onPhoneChange(val.replace(/\D/g, ''))}
        keyboardType="phone-pad"
      />
      <AppButton
        title="Continue"
        loading={isLoading}
        className="mt-8"
        disabled={phone.length < 9}
        onPress={onSubmit}
      />
    </StepWrapper>
  );
};
