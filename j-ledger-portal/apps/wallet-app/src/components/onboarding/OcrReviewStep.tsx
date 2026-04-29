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
    prefixTh: string;
    firstNameTh: string;
    lastNameTh: string;
    prefixEn: string;
    firstNameEn: string;
    lastNameEn: string;
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
    data.firstNameTh.trim().length > 0 &&
    data.lastNameTh.trim().length > 0 &&
    data.firstNameEn.trim().length > 0 &&
    data.lastNameEn.trim().length > 0 &&
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
          <View className="flex-row gap-4 mb-4">
            <View className="w-24">
              <AppTextInput
                label="PREFIX"
                value={data.prefixTh}
                onChangeText={(v) => setData('prefixTh', v)}
              />
            </View>
            <View className="flex-1">
              <AppTextInput
                label="FIRST NAME (TH)"
                value={data.firstNameTh}
                onChangeText={(v) => setData('firstNameTh', v)}
              />
            </View>
          </View>
          <AppTextInput
            label="LAST NAME (TH)"
            value={data.lastNameTh}
            onChangeText={(v) => setData('lastNameTh', v)}
          />
        </View>

        <View className="mb-4">
          <Text className="text-xs font-manrope font-extrabold text-primary mb-3 uppercase">
            English Information
          </Text>
          <View className="flex-row gap-4 mb-4">
            <View className="w-24">
              <AppTextInput
                label="PREFIX"
                value={data.prefixEn}
                onChangeText={(v) => setData('prefixEn', v)}
              />
            </View>
            <View className="flex-1">
              <AppTextInput
                label="FIRST NAME (EN)"
                value={data.firstNameEn}
                onChangeText={(v) => setData('firstNameEn', v)}
              />
            </View>
          </View>
          <AppTextInput
            label="LAST NAME (EN)"
            value={data.lastNameEn}
            onChangeText={(v) => setData('lastNameEn', v)}
          />
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
