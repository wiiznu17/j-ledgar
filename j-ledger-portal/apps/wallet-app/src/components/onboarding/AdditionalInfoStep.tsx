import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, Square } from 'lucide-react-native';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { AppSelector } from '@/components/common/AppSelector';
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
  idCardAddress?: {
    line1?: string;
    subdistrict?: string;
    district?: string;
    province?: string;
    postalCode?: string;
  };
  setData: (field: string, value: any) => void;
  isLoading: boolean;
  onSubmit: (useIdentityAddress: boolean) => void;
}

const OCCUPATION_OPTIONS = [
  { label: 'Student', value: 'Student' },
  { label: 'Private Employee', value: 'Private Employee' },
  { label: 'Government Employee', value: 'Government Employee' },
  { label: 'Business Owner', value: 'Business Owner' },
  { label: 'Freelance', value: 'Freelance' },
  { label: 'Unemployed', value: 'Unemployed' },
  { label: 'Retired', value: 'Retired' },
  { label: 'Other', value: 'OTHER' },
];

const SOURCE_OF_FUNDS_OPTIONS = [
  { label: 'Salary', value: 'Salary' },
  { label: 'Business Profit', value: 'Business Profit' },
  { label: 'Savings', value: 'Savings' },
  { label: 'Investment', value: 'Investment' },
  { label: 'Inheritance', value: 'Inheritance' },
  { label: 'Other', value: 'OTHER' },
];

const PURPOSE_OPTIONS = [
  { label: 'Savings', value: 'Savings' },
  { label: 'Investment', value: 'Investment' },
  { label: 'Personal Expense', value: 'Personal Expense' },
  { label: 'Business Transaction', value: 'Business Transaction' },
  { label: 'Other', value: 'OTHER' },
];

export const AdditionalInfoStep: React.FC<AdditionalInfoStepProps> = ({
  visible,
  data,
  idCardAddress,
  setData,
  isLoading,
  onSubmit,
}) => {
  const [isSameAsId, setIsSameAsId] = useState(false);
  const [otherOccupation, setOtherOccupation] = useState('');
  const [otherSource, setOtherSource] = useState('');
  const [otherPurpose, setOtherPurpose] = useState('');

  const handleToggleSameAsId = () => {
    const newValue = !isSameAsId;
    setIsSameAsId(newValue);
    // Note: We don't need to fill the address fields here anymore if useIdentityAddress is true,
    // but we'll keep the logic to show the data to the user if they want to see it.
    if (newValue && idCardAddress) {
      setData('addressField', { field: 'line1', text: idCardAddress.line1 || '' });
      setData('addressField', { field: 'subdistrict', text: idCardAddress.subdistrict || '' });
      setData('addressField', { field: 'district', text: idCardAddress.district || '' });
      setData('addressField', { field: 'province', text: idCardAddress.province || '' });
      // Postal code is NOT on ID card, so user MUST still fill it
    }
  };

  const isValid =
    (isSameAsId ||
      (data.address.line1?.trim().length! > 0 &&
        data.address.subdistrict?.trim().length! > 0 &&
        data.address.district?.trim().length! > 0 &&
        data.address.province?.trim().length! > 0)) &&
    data.address.postalCode?.trim().length! > 0 &&
    data.occupation.trim().length > 0 &&
    (data.occupation !== 'OTHER' || otherOccupation.trim().length > 0) &&
    data.incomeRange.trim().length > 0 &&
    data.sourceOfFunds.trim().length > 0 &&
    (data.sourceOfFunds !== 'OTHER' || otherSource.trim().length > 0) &&
    data.purpose.trim().length > 0 &&
    (data.purpose !== 'OTHER' || otherPurpose.trim().length > 0);

  const handleFinalSubmit = () => {
    // If "Other" was selected, use the manual text
    if (data.occupation === 'OTHER') setData('occupation', otherOccupation);
    if (data.sourceOfFunds === 'OTHER') setData('sourceOfFunds', otherSource);
    if (data.purpose === 'OTHER') setData('purpose', otherPurpose);
    onSubmit(isSameAsId);
  };

  return (
    <StepWrapper visible={visible}>
      <StepHeader title="More Details" subtitle="Tell us a bit more about yourself." />
      <View className="flex-col gap-y-5">
        {/* Current Address Section */}
        <View className="mb-2">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-sm font-manrope font-extrabold text-on-surface uppercase tracking-wider">
              Current Address
            </Text>
            <TouchableOpacity
              onPress={handleToggleSameAsId}
              className="flex-row items-center gap-2"
            >
              {isSameAsId ? (
                <View className="bg-primary rounded-md p-0.5">
                  <Check size={14} color="white" />
                </View>
              ) : (
                <Square size={18} color="#f48fb1" opacity={0.5} />
              )}
              <Text className="text-[11px] font-manrope font-bold text-on-surfaceVariant">
                Same as ID Card
              </Text>
            </TouchableOpacity>
          </View>

          {!isSameAsId && (
            <>
              <AppTextInput
                label="HOUSE NO / STREET"
                value={data.address.line1}
                onChangeText={(v) => {
                  setData('addressField', { field: 'line1', text: v });
                }}
              />
              <View className="flex-row gap-4 mt-4">
                <View className="flex-1">
                  <AppTextInput
                    label="SUB-DISTRICT"
                    value={data.address.subdistrict}
                    onChangeText={(v) => {
                      setData('addressField', { field: 'subdistrict', text: v });
                    }}
                  />
                </View>
                <View className="flex-1">
                  <AppTextInput
                    label="DISTRICT"
                    value={data.address.district}
                    onChangeText={(v) => {
                      setData('addressField', { field: 'district', text: v });
                    }}
                  />
                </View>
              </View>
              <View className="flex-row gap-4 mt-4">
                <View className="flex-1">
                  <AppTextInput
                    label="PROVINCE"
                    value={data.address.province}
                    onChangeText={(v) => {
                      setData('addressField', { field: 'province', text: v });
                    }}
                  />
                </View>
                <View className="flex-1">
                  <AppTextInput
                    label="POSTAL CODE"
                    value={data.address.postalCode}
                    onChangeText={(v) => {
                      setData('addressField', { field: 'postalCode', text: v });
                    }}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              </View>
            </>
          )}

          {isSameAsId && (
            <View className="bg-primary/5 border border-primary/10 rounded-[24px] p-5">
              <Text className="text-[11px] font-manrope font-extrabold text-primary uppercase tracking-widest mb-3">
                Using Address from ID Card
              </Text>
              <Text className="text-base font-manrope font-bold text-on-surface mb-5 leading-6">
                {data.address?.line1 || 'No address data'}
                {'\n'}
                {data.address?.subdistrict || ''}
                {data.address?.district ? `, ${data.address.district}` : ''}
                {data.address?.province ? `, ${data.address.province}` : ''}
              </Text>
              <AppTextInput
                label="POSTAL CODE"
                value={data.address.postalCode}
                onChangeText={(v) => {
                  setData('addressField', { field: 'postalCode', text: v });
                }}
                keyboardType="number-pad"
                maxLength={5}
                placeholder="Required"
              />
            </View>
          )}
        </View>

        <View className="h-px bg-on-surfaceVariant/5 my-2" />

        {/* Profile Info Section */}
        <View className="flex-row gap-4">
          <View className="flex-1">
            <AppSelector
              label="Occupation"
              value={data.occupation}
              options={OCCUPATION_OPTIONS}
              onSelect={(v) => setData('occupation', v)}
            />
          </View>
          <View className="flex-1">
            <AppTextInput
              label="Monthly Income"
              value={data.incomeRange}
              onChangeText={(v) => setData('incomeRange', v)}
              keyboardType="number-pad"
              placeholder="e.g. 50000"
            />
          </View>
        </View>

        {data.occupation === 'OTHER' && (
          <AppTextInput
            label="Please specify occupation"
            value={otherOccupation}
            onChangeText={setOtherOccupation}
            placeholder="Type your occupation"
          />
        )}

        <AppSelector
          label="Source of funds"
          value={data.sourceOfFunds}
          options={SOURCE_OF_FUNDS_OPTIONS}
          onSelect={(v) => setData('sourceOfFunds', v)}
        />

        {data.sourceOfFunds === 'OTHER' && (
          <AppTextInput
            label="Please specify source of funds"
            value={otherSource}
            onChangeText={setOtherSource}
            placeholder="Type source of funds"
          />
        )}

        <AppSelector
          label="Purpose of Account"
          value={data.purpose}
          options={PURPOSE_OPTIONS}
          onSelect={(v) => setData('purpose', v)}
        />

        {data.purpose === 'OTHER' && (
          <AppTextInput
            label="Please specify purpose"
            value={otherPurpose}
            onChangeText={setOtherPurpose}
            placeholder="Type purpose of account"
          />
        )}

        <View className="pt-4">
          <AppButton
            title="Next Step"
            loading={isLoading}
            disabled={!isValid}
            onPress={handleFinalSubmit}
          />
        </View>
      </View>
    </StepWrapper>
  );
};
