import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { StepWrapper } from '@/components/common/StepWrapper';
import { StepHeader } from './StepHeader';

interface OcrReviewStepProps {
  visible: boolean;
  idCardUri: string | null;
  data: {
    idNumber: string;
    issueDate: string;
    expiryDate: string;
    prefix: string;
    thaiName: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    religion: string;
    address: string;
  };
  setData: (field: string, value: string) => void;
  isLoading: boolean;
  onConfirm: () => void;
  onRescan: () => void;
}

export const OcrReviewStep: React.FC<OcrReviewStepProps> = ({
  visible,
  idCardUri,
  data,
  setData,
  isLoading,
  onConfirm,
  onRescan,
}) => {
  const isValid =
    data.idNumber.length === 13 &&
    data.thaiName.trim().length > 0 &&
    data.firstName.trim().length > 0 &&
    data.lastName.trim().length > 0 &&
    data.dateOfBirth.trim().length > 0;

  return (
    <StepWrapper visible={visible}>
      <StepHeader title="Verify Details" subtitle="Check if your information is correct." />
      <View className="w-full aspect-[1.58] bg-white rounded-3xl mb-8 overflow-hidden">
        {idCardUri && <Image source={{ uri: idCardUri }} className="w-full h-full" />}
      </View>
      <ScrollView className="space-y-6" showsVerticalScrollIndicator={false}>
        <View className="mb-4">
          <Text className="text-xs font-manrope font-extrabold text-primary mb-3 uppercase">
            Identity & Dates
          </Text>
          <AppTextInput
            label="ID NUMBER"
            value={data.idNumber}
            onChangeText={(v) => setData('idNumber', v)}
            keyboardType="number-pad"
            maxLength={13}
          />
          <View className="flex-row gap-4 mt-4">
            <View className="flex-1">
              <AppTextInput
                label="ISSUE DATE"
                value={data.issueDate}
                onChangeText={(v) => setData('issueDate', v)}
                placeholder="DD/MM/YYYY"
              />
            </View>
            <View className="flex-1">
              <AppTextInput
                label="EXPIRY DATE"
                value={data.expiryDate}
                onChangeText={(v) => setData('expiryDate', v)}
                placeholder="DD/MM/YYYY"
              />
            </View>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-xs font-manrope font-extrabold text-primary mb-3 uppercase">
            Thai Information
          </Text>
          <View className="flex-row gap-4">
            <View className="w-24">
              <AppTextInput
                label="PREFIX"
                value={data.prefix}
                onChangeText={(v) => setData('prefix', v)}
              />
            </View>
            <View className="flex-1">
              <AppTextInput
                label="FULL NAME (THAI)"
                value={data.thaiName}
                onChangeText={(v) => setData('thaiName', v)}
              />
            </View>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-xs font-manrope font-extrabold text-primary mb-3 uppercase">
            English Information
          </Text>
          <AppTextInput
            label="FIRST NAME"
            value={data.firstName}
            onChangeText={(v) => setData('firstName', v)}
          />
          <View className="mt-4">
            <AppTextInput
              label="LAST NAME"
              value={data.lastName}
              onChangeText={(v) => setData('lastName', v)}
            />
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-xs font-manrope font-extrabold text-primary mb-3 uppercase">
            Additional Info
          </Text>
          <AppTextInput
            label="DATE OF BIRTH"
            placeholder="DD/MM/YYYY"
            value={data.dateOfBirth}
            onChangeText={(v) => setData('dateOfBirth', v)}
          />
          <View className="mt-4">
            <AppTextInput
              label="RELIGION"
              value={data.religion}
              onChangeText={(v) => setData('religion', v)}
            />
          </View>
          <View className="mt-4">
            <AppTextInput
              label="ADDRESS"
              value={data.address}
              onChangeText={(v) => setData('address', v)}
              multiline
            />
          </View>
        </View>

        <View className="pt-6 space-y-4 mb-4">
          <AppButton
            className="mb-2"
            title="Confirm Data"
            loading={isLoading}
            disabled={!isValid}
            onPress={onConfirm}
          />
          <AppButton title="Rescan" variant="outline" onPress={onRescan} />
        </View>
      </ScrollView>
    </StepWrapper>
  );
};
