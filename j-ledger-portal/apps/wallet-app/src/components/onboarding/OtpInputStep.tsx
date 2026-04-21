import React, { useRef } from 'react';
import { View, TextInput } from 'react-native';
import { AppButton } from '@/components/common/AppButton';
import { StepWrapper } from '@/components/common/StepWrapper';
import { StepHeader } from './StepHeader';

interface OtpInputStepProps {
  visible: boolean;
  otp: string[];
  phone: string;
  isLoading: boolean;
  onOtpChange: (index: number, value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const OtpInputStep: React.FC<OtpInputStepProps> = ({
  visible,
  otp,
  phone,
  isLoading,
  onOtpChange,
  onSubmit,
  onBack,
}) => {
  const otpRefs = useRef<Array<TextInput | null>>([]);

  const formatPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  return (
    <StepWrapper visible={visible}>
      <StepHeader title="Verification" subtitle={`Sent to ${formatPhone(phone)}`} onBack={onBack} />
      <View className="flex-row justify-between mb-10">
        {otp.map((digit, i) => (
          <View
            key={i}
            className="w-[14%] aspect-[0.75] bg-white/40 border border-outline-variant/20 rounded-2xl items-center justify-center shadow-inner"
          >
            <TextInput
              ref={(el) => {
                otpRefs.current[i] = el;
              }}
              className="text-center w-full h-full p-0 text-2xl font-manrope font-black text-on-surface"
              maxLength={1}
              keyboardType="number-pad"
              autoFocus={i === 0}
              value={digit}
              onChangeText={(val) => {
                const char = val.slice(-1);
                onOtpChange(i, char);
                if (val && i < 5) {
                  otpRefs.current[i + 1]?.focus();
                }
              }}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
                  otpRefs.current[i - 1]?.focus();
                }
              }}
            />
          </View>
        ))}
      </View>
      <AppButton
        title="Verify"
        loading={isLoading}
        disabled={otp.some((d) => !d)}
        onPress={onSubmit}
      />
    </StepWrapper>
  );
};
