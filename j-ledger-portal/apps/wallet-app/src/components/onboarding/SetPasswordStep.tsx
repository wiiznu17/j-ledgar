import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react-native';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { StepWrapper } from '@/components/common/StepWrapper';
import { StepHeader } from './StepHeader';

interface SetPasswordStepProps {
  visible: boolean;
  password: string;
  confirmPassword: string;
  onPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
}

export const SetPasswordStep: React.FC<SetPasswordStepProps> = ({
  visible,
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  isLoading,
  onSubmit,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const rules = [
    { label: 'At least 12 characters', met: password.length >= 12 },
    { label: 'Uppercase & lowercase letters', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'At least 1 number', met: /\d/.test(password) },
    { label: 'At least 1 special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    { label: 'No repeating/sequential patterns', met: password.length > 0 && !/(123|234|345|456|567|678|789|890|098|987|876|765|654|543|432|321|210|012|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|qwe|wer|ert|rty|tyu|yui|uio|iop|pas|asd|sdf|dfg|fgh|ghj|hjk|jkl)/i.test(password) && !/([a-zA-Z0-9])\1{2}/.test(password) && !/(password|admin|user|test|guest|root|login|welcome|hello|monkey|dragon|football|baseball|letmein|master|shadow|sunshine|princess|qwerty)/i.test(password) },
    { label: 'Passwords match', met: !!password && password === confirmPassword },
  ];

  const allMet = rules.every((r) => r.met);

  return (
    <StepWrapper visible={visible}>
      <StepHeader title="Account Password" subtitle="Create a password to secure your login." />
      <View className="space-y-4">
        <AppTextInput
          label="Password"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={onPasswordChange}
          placeholder="Min. 12 characters"
          rightElement={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={20} color="#9e9e9e" />
              ) : (
                <Eye size={20} color="#9e9e9e" />
              )}
            </TouchableOpacity>
          }
        />

        {/* Rules Checklist */}
        <View className="bg-white/40 p-4 rounded-2xl border border-outline-variant/10 my-2">
          {rules.map((rule, idx) => (
            <View key={idx} className="flex-row items-center gap-3 mb-2 last:mb-0">
              {rule.met ? (
                <CheckCircle2 size={16} color="#4caf50" />
              ) : (
                <Circle size={16} color="#9e9e9e" />
              )}
              <Text
                className={`text-xs font-manrope font-medium ${rule.met ? 'text-on-surface' : 'text-on-surfaceVariant'}`}
              >
                {rule.label}
              </Text>
            </View>
          ))}
        </View>

        <AppTextInput
          label="Confirm Password"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={onConfirmPasswordChange}
          placeholder="Repeat your password"
          rightElement={
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? (
                <EyeOff size={20} color="#9e9e9e" />
              ) : (
                <Eye size={20} color="#9e9e9e" />
              )}
            </TouchableOpacity>
          }
        />

        <View className="pt-4">
          <AppButton title="Continue" loading={isLoading} disabled={!allMet} onPress={onSubmit} />
        </View>
      </View>
    </StepWrapper>
  );
};
