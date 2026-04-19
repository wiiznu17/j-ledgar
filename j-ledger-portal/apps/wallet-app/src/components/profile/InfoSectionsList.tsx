import React from 'react';
import { View, Text } from 'react-native';
import { User, MapPin, Phone, Briefcase, ShieldCheck } from 'lucide-react-native';
import { DataSection, InfoItem } from './ProfileUIAtoms';

export interface InfoSectionsListProps {
  formData: any;
  onEdit: (section: string) => void;
}

export function InfoSectionsList({ formData, onEdit }: InfoSectionsListProps) {
  // Helper to mask ID Card: 1234567890123 -> 1-2345-XXXXX-XX-X
  const maskIdCard = (id: string) => {
    if (!id || id.length < 13) return id;
    return `${id.slice(0, 1)}-${id.slice(1, 5)}-XXXXX-${id.slice(10, 12)}-${id.slice(12)}`;
  };

  // Helper to mask phone: 0812345678 -> 081-XXX-XX78
  const maskPhone = (p: string) => {
    if (!p || p.length < 10) return p;
    return `${p.slice(0, 3)}-XXX-XX${p.slice(8)}`;
  };

  return (
    <View className="space-y-3 gap-y-3">
      {/* 1. Identification Section */}
      <DataSection
        title="Identification Info"
        icon={<ShieldCheck color="#a855f7" />}
        onEdit={() => {}} // No edit for identification
      >
        <View className="gap-y-4">
          <View className="flex-row justify-between">
            <InfoItem
              label="Verification Status"
              value="Tier 2 Verified"
              valueClass="text-green-500"
            />
            <InfoItem label="Identity Type" value="ID Card" />
          </View>
          <InfoItem label="Identity Number" value={maskIdCard(formData.idNumber)} />
          <View className="flex-row">
            <View className="w-1/2">
              <InfoItem label="Name (Thai)" value={`${formData.prefixTh}${formData.nameTh}`} />
            </View>
            <View className="w-1/2">
              <InfoItem label="Name (English)" value={`${formData.prefixEn} ${formData.nameEn}`} />
            </View>
          </View>
          <View className="flex-row">
            <View className="w-1/2">
              <InfoItem label="Date of Birth" value={formData.dob} />
            </View>
          </View>
          <View className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Registered ID Card Address
            </Text>
            <Text className="text-[11px] font-bold text-gray-500 leading-snug">
              {`${formData.idAddress.street}, ${formData.idAddress.subdistrict}, ${formData.idAddress.district}, ${formData.idAddress.province} ${formData.idAddress.postalCode}`}
            </Text>
          </View>
        </View>
      </DataSection>

      {/* 2. Contact Information */}
      <DataSection
        title="Contact Details"
        icon={<Phone color="#3b82f6" />}
        onEdit={() => onEdit('CONTACT')}
      >
        <View className="space-y-4">
          <InfoItem label="Verified Email" value={formData.email} />
          <View className="flex-row justify-between items-center">
            <InfoItem label="Mobile Number" value={maskPhone(formData.phone)} />
            <View className="bg-blue-50 px-2 py-1 rounded-md">
              <Text className="text-[8px] font-black uppercase tracking-widest text-blue-500">
                Primary
              </Text>
            </View>
          </View>
        </View>
      </DataSection>

      {/* 3. Address Information */}
      <DataSection
        title="Current / Shipping Address"
        icon={<MapPin color="#f97316" />}
        onEdit={() => onEdit('ADDRESS')}
      >
        <View className="gap-y-4">
          <InfoItem label="Street / House No." value={formData.currentAddress.street} />
          <View className="flex-row">
            <View className="w-1/2">
              <InfoItem label="Sub-district" value={formData.currentAddress.subdistrict} />
            </View>
            <View className="w-1/2">
              <InfoItem label="District" value={formData.currentAddress.district} />
            </View>
          </View>
          <View className="flex-row">
            <View className="w-1/2">
              <InfoItem label="Province" value={formData.currentAddress.province} />
            </View>
            <View className="w-1/2">
              <InfoItem label="Postal Code" value={formData.currentAddress.postalCode} />
            </View>
          </View>
        </View>
      </DataSection>

      {/* 4. Employment & Income Information */}
      <DataSection
        title="Employment & Income"
        icon={<Briefcase color="#14b8a6" />}
        onEdit={() => onEdit('EMPLOYMENT')}
      >
        <View className="flex-row flex-wrap">
          <View className="w-1/2 mb-4">
            <InfoItem label="Occupation" value={formData.occupation} />
          </View>
          <View className="w-1/2 mb-4">
            <InfoItem label="Monthly Income" value={formData.income} />
          </View>
          <View className="w-1/2">
            <InfoItem label="Source of Income" value={formData.sourceOfIncome} />
          </View>
          <View className="w-1/2">
            <InfoItem label="Usage Purpose" value={formData.purpose} />
          </View>
        </View>
        <View className="bg-gray-50 p-3 rounded-2xl border border-gray-100 mt-4">
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Work / Study Location
          </Text>
          <Text className="text-[11px] font-bold text-gray-500 leading-snug">
            {`${formData.workAddress.street}, ${formData.workAddress.subdistrict}, ${formData.workAddress.district}, ${formData.workAddress.province} ${formData.workAddress.postalCode}`}
          </Text>
        </View>
      </DataSection>
    </View>
  );
}
