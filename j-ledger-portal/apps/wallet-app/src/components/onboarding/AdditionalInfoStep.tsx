import React from 'react';
import { View } from 'react-native';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { StepWrapper } from '@/components/common/StepWrapper';
import { StepHeader } from './StepHeader';

interface AdditionalInfoStepProps {
  visible: boolean;
  data: {
    address: {
      line1?: string;
      subdistrict?: string;
      district?: string;
      province?: string;
      postalCode?: string;
    };
    occupation: string;
    incomeRange: string;
    sourceOfFunds: string;
    purpose: string;
  };
  setData: (field: string, value: any) => void;
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
    data.address.line1?.trim().length! > 0 &&
    data.address.subdistrict?.trim().length! > 0 &&
    data.address.district?.trim().length! > 0 &&
    data.address.province?.trim().length! > 0 &&
    data.address.postalCode?.trim().length! > 0 &&
    data.occupation.trim().length > 0 &&
    data.incomeRange.trim().length > 0 &&
    data.sourceOfFunds.trim().length > 0 &&
    data.purpose.trim().length > 0;

  return (
    <StepWrapper visible={visible}>
      <StepHeader title="More Details" subtitle="Tell us a bit more about yourself." />
      <View className="flex-col gap-y-5">
        <View className="mb-2">
          <AppTextInput
            label="HOUSE NO / STREET"
            value={data.address.line1}
            onChangeText={(v) => setData('addressField', { field: 'line1', text: v })}
          />
          <View className="flex-row gap-4 mt-4">
            <View className="flex-1">
              <AppTextInput
                label="SUB-DISTRICT"
                value={data.address.subdistrict}
                onChangeText={(v) => setData('addressField', { field: 'subdistrict', text: v })}
              />
            </View>
            <View className="flex-1">
              <AppTextInput
                label="DISTRICT"
                value={data.address.district}
                onChangeText={(v) => setData('addressField', { field: 'district', text: v })}
              />
            </View>
          </View>
          <View className="flex-row gap-4 mt-4">
            <View className="flex-1">
              <AppTextInput
                label="PROVINCE"
                value={data.address.province}
                onChangeText={(v) => setData('addressField', { field: 'province', text: v })}
              />
            </View>
            <View className="flex-1">
              <AppTextInput
                label="POSTAL CODE"
                value={data.address.postalCode}
                onChangeText={(v) => setData('addressField', { field: 'postalCode', text: v })}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
          </View>
        </View>
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
