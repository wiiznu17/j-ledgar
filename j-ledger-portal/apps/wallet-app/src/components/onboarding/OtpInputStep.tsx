import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppButton } from '@/components/common/AppButton';
import { StepWrapper } from '@/components/common/StepWrapper';
import { StepHeader } from './StepHeader';
import { OtpInputFields } from '../common/OtpInputFields';

interface OtpInputStepProps {
  visible: boolean;
  otp: string[];
  phone: string;
  isLoading: boolean;
  resendTimer: number;
  onOtpChange: (index: number, value: string) => void;
  onResend: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const OtpInputStep: React.FC<OtpInputStepProps> = ({
  visible,
  otp,
  phone,
  isLoading,
  resendTimer,
  onOtpChange,
  onResend,
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
      <StepHeader title="Verification" subtitle={`Sent to ${formatPhone(phone)}`} onBack={onBack} />
      <View className="mb-10">
        <OtpInputFields otp={otp} onOtpChange={onOtpChange} isLoading={isLoading} />
      </View>
      <AppButton
        title="Verify"
        loading={isLoading}
        disabled={otp.some((d) => !d)}
        onPress={onSubmit}
      />

      <View className="mt-8 items-center">
        {resendTimer > 0 ? (
          <Text className="text-gray-400 font-manrope font-medium text-sm">
            Resend code in <Text className="text-[#f48fb1] font-black">{resendTimer}s</Text>
          </Text>
        ) : (
          <TouchableOpacity onPress={onResend} disabled={isLoading}>
            <Text className="text-[#f48fb1] font-manrope font-black text-sm underline">
              {isLoading ? 'Requesting...' : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </StepWrapper>
  );
};
