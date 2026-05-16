import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import { AppButton } from '@/components/common/AppButton';
import { AppTextInput } from '@/components/common/AppTextInput';
import { StepWrapper } from '@/components/common/StepWrapper';
import { StepHeader } from './StepHeader';
import { ThaiDatePickerModal } from './ThaiDatePickerModal';
import { Calendar } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

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
    registeredAddress: {
      line1?: string;
      subdistrict?: string;
      district?: string;
      province?: string;
      postalCode?: string;
    };
  };
  setData: (field: string, value: any) => void;
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
  const [pickerConfig, setPickerConfig] = React.useState<{
    visible: boolean;
    field: string;
    title: string;
    initialValue: string;
  }>({
    visible: false,
    field: '',
    title: '',
    initialValue: '',
  });

  const openPicker = (field: string, title: string, initialValue: string) => {
    setPickerConfig({
      visible: true,
      field,
      title,
      initialValue,
    });
  };

  const handleDateSelect = (dateStr: string) => {
    setData(pickerConfig.field, dateStr);
  };
  const isValid =
    data.idNumber.replace(/\D/g, '').length === 13 &&
    data.firstNameTh.trim().length > 0 &&
    data.lastNameTh.trim().length > 0 &&
    data.firstNameEn.trim().length > 0 &&
    data.lastNameEn.trim().length > 0 &&
    data.dateOfBirth.trim().length > 0;

  return (
    <StepWrapper visible={visible}>
      <StepHeader
        title="Verify Details"
        subtitle="Check if your information is correct."
      />
      <View className="w-full aspect-[1.58] bg-white rounded-3xl mb-8 overflow-hidden">
        {idCardUri && (
          <Image source={{ uri: idCardUri }} className="w-full h-full" />
        )}
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
            <TouchableOpacity
              onPress={() =>
                openPicker('issueDate', 'เลือกวันออกบัตร', data.issueDate)
              }
              className="flex-1"
            >
              <View pointerEvents="none">
                <AppTextInput
                  label="ISSUE DATE (พ.ศ.)"
                  value={data.issueDate}
                  placeholder="เลือกวันที่"
                  editable={false}
                />
                <View className="absolute right-4 bottom-4">
                  <Calendar size={18} color="#f48fb1" />
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                openPicker('expiryDate', 'เลือกวันหมดอายุ', data.expiryDate)
              }
              className="flex-1"
            >
              <View pointerEvents="none">
                <AppTextInput
                  label="EXPIRY DATE (พ.ศ.)"
                  value={data.expiryDate}
                  placeholder="เลือกวันที่"
                  editable={false}
                />
                <View className="absolute right-4 bottom-4">
                  <Calendar size={18} color="#f48fb1" />
                </View>
              </View>
            </TouchableOpacity>
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
          <TouchableOpacity
            onPress={() =>
              openPicker('dateOfBirth', 'เลือกวันเกิด', data.dateOfBirth)
            }
            className="mb-4"
          >
            <View pointerEvents="none">
              <AppTextInput
                label="DATE OF BIRTH (พ.ศ.)"
                placeholder="เลือกวันที่"
                value={data.dateOfBirth}
                editable={false}
              />
              <View className="absolute right-4 bottom-4">
                <Calendar size={18} color="#f48fb1" />
              </View>
            </View>
          </TouchableOpacity>
          <View className="mt-4">
            <AppTextInput
              label="RELIGION"
              value={data.religion}
              onChangeText={(v) => setData('religion', v)}
            />
          </View>
          <View className="mt-4">
            <AppTextInput
              label="HOUSE NO / STREET"
              value={data.registeredAddress.line1}
              onChangeText={(v) =>
                setData('addressField', { field: 'line1', text: v })
              }
            />
          </View>
          <View className="flex-row gap-4 mt-4">
            <View className="flex-1">
              <AppTextInput
                label="SUB-DISTRICT"
                value={data.registeredAddress.subdistrict}
                onChangeText={(v) =>
                  setData('addressField', { field: 'subdistrict', text: v })
                }
              />
            </View>
            <View className="flex-1">
              <AppTextInput
                label="DISTRICT"
                value={data.registeredAddress.district}
                onChangeText={(v) =>
                  setData('addressField', { field: 'district', text: v })
                }
              />
            </View>
          </View>
          <View className="mt-4">
            <AppTextInput
              label="PROVINCE"
              value={data.registeredAddress.province}
              onChangeText={(v) =>
                setData('addressField', { field: 'province', text: v })
              }
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
          {!isValid && (
            <Text className="text-[10px] text-red-400 text-center mt-2">
              Missing: {[
                data.idNumber.replace(/\D/g, '').length !== 13 && "ID(13)",
                !data.firstNameTh.trim() && "NameTH",
                !data.lastNameTh.trim() && "LastTH",
                !data.firstNameEn.trim() && "NameEN",
                !data.lastNameEn.trim() && "LastEN",
                !data.dateOfBirth.trim() && "DOB"
              ].filter(Boolean).join(', ')}
            </Text>
          )}
          <AppButton title="Rescan" variant="outline" onPress={onRescan} />
        </View>
      </ScrollView>

      <ThaiDatePickerModal
        visible={pickerConfig.visible}
        title={pickerConfig.title}
        initialValue={pickerConfig.initialValue}
        onClose={() => setPickerConfig((prev) => ({ ...prev, visible: false }))}
        onSelect={handleDateSelect}
      />
    </StepWrapper>
  );
};
