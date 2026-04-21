import React from 'react';
import { View } from 'react-native';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { StepWrapper } from '@/components/common/StepWrapper';
import { StepHeader } from './StepHeader';

interface AdditionalInfoStepProps {
  visible: boolean;
  data: {
    address: string;
    occupation: string;
    incomeRange: string;
    sourceOfFunds: string;
    purpose: string;
  };
  setData: (field: string, value: string) => void;
  isLoading: boolean;
  onSubmit: () => void;
}

export const AdditionalInfoStep: React.FC<AdditionalInfoStepProps> = ({
  visible,
  data,
  setData,
  isLoading,
  onSubmit,
}) => {
  const isValid =
    data.address.trim().length > 0 &&
    data.occupation.trim().length > 0 &&
    data.incomeRange.trim().length > 0 &&
    data.sourceOfFunds.trim().length > 0 &&
    data.purpose.trim().length > 0;

  return (
    <StepWrapper visible={visible}>
      <StepHeader title="More Details" subtitle="Tell us a bit more about yourself." />
      <View className="flex-col gap-y-5">
        <AppTextInput
          label="Address"
          value={data.address}
          onChangeText={(v) => setData('address', v)}
          multiline
        />
        <View className="flex-row gap-4">
          <View className="flex-1">
            <AppTextInput
              label="Occupation"
              value={data.occupation}
              onChangeText={(v) => setData('occupation', v)}
              containerClassName="w-full"
            />
          </View>
          <View className="flex-1">
            <AppTextInput
              label="Monthly Income"
              value={data.incomeRange}
              onChangeText={(v) => setData('incomeRange', v)}
              containerClassName="w-full"
            />
          </View>
        </View>
        <AppTextInput
          label="Source of funds"
          value={data.sourceOfFunds}
          onChangeText={(v) => setData('sourceOfFunds', v)}
        />
        <AppTextInput
          label="Purpose of Account"
          value={data.purpose}
          onChangeText={(v) => setData('purpose', v)}
        />
        <View className="pt-2 mt-2">
          <AppButton title="Next Step" loading={isLoading} disabled={!isValid} onPress={onSubmit} />
        </View>
      </View>
    </StepWrapper>
  );
};
