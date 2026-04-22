import React, { useRef, useEffect } from 'react';
import { View, TextInput } from 'react-native';

interface OtpInputFieldsProps {
  otp: string[];
  onOtpChange: (index: number, value: string) => void;
  isLoading?: boolean;
}

export const OtpInputFields: React.FC<OtpInputFieldsProps> = ({
  otp,
  onOtpChange,
  isLoading = false,
}) => {
  const otpRefs = useRef<Array<TextInput | null>>([]);

  // Auto-focus first field on mount
  useEffect(() => {
    setTimeout(() => {
      otpRefs.current[0]?.focus();
    }, 100);
  }, []);

  return (
    <View className="flex-row justify-between w-full h-[60px]">
      {otp.map((digit, i) => (
        <View
          key={i}
          className={`w-[14%] h-full bg-white/40 border rounded-2xl items-center justify-center shadow-inner ${
            digit ? 'border-[#f48fb1]' : 'border-gray-200/50'
          }`}
        >
          <TextInput
            ref={(el) => {
              otpRefs.current[i] = el;
            }}
            className="text-center w-full h-full p-0 text-2xl font-manrope font-black text-[#1a1a1a]"
            maxLength={1}
            keyboardType="number-pad"
            editable={!isLoading}
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
  );
};
