import React from 'react';
import { View, Text } from 'react-native';
import { User, MapPin, Phone, Briefcase } from 'lucide-react-native';
import { DataSection, InfoItem } from './ProfileUIAtoms';

export interface InfoSectionsListProps {
  formData: any;
  onEdit: (section: string) => void;
}

export function InfoSectionsList({ formData, onEdit }: InfoSectionsListProps) {
  return (
    <View className="space-y-3 gap-y-3">
      <DataSection
        title="General Info"
        icon={<User color="#f48fb1" />}
        onEdit={() => onEdit('GENERAL')}
      >
        <View className="flex-row justify-between">
          <InfoItem label="Full Name" value={formData.name} />
          <InfoItem label="Identity" value="KYC Verified" valueClass="text-green-500" />
        </View>
      </DataSection>

      <DataSection
        title="Address Details"
        icon={<MapPin color="#f97316" />} // Orange
        onEdit={() => onEdit('ADDRESS')}
      >
        <View className="gap-y-4">
          <InfoItem label="Street / House No." value={formData.address.street} />
          <View className="flex-row">
            <View className="w-1/2">
              <InfoItem label="Sub-district" value={formData.address.subdistrict} />
            </View>
            <View className="w-1/2">
              <InfoItem label="District" value={formData.address.district} />
            </View>
          </View>
          <View className="flex-row">
            <View className="w-1/2">
              <InfoItem label="Province" value={formData.address.province} />
            </View>
            <View className="w-1/2">
              <InfoItem label="Postal Code" value={formData.address.postalCode} />
            </View>
          </View>
        </View>
      </DataSection>

      <DataSection
        title="Contact Information"
        icon={<Phone color="#3b82f6" />} // Blue
        onEdit={() => onEdit('CONTACT')}
      >
        <View className="space-y-4">
          <InfoItem label="Email Address" value={formData.email} />
          <View className="flex-row justify-between items-center">
            <InfoItem label="Mobile Number" value={formData.phone} />
            <View className="bg-blue-50 px-2 py-1 rounded-md">
              <Text className="text-[8px] font-black uppercase tracking-widest text-blue-500">
                Primary
              </Text>
            </View>
          </View>
        </View>
      </DataSection>

      <DataSection
        title="Work & Study Info"
        icon={<Briefcase color="#a855f7" />} // Purple
        onEdit={() => onEdit('WORK_STUDY')}
      >
        <View className="flex-row flex-wrap">
          <View className="w-1/2 mb-4">
            <InfoItem label="Occupation" value={formData.occupation} />
          </View>
          <View className="w-1/2 mb-4">
            <InfoItem label="Income" value={formData.income} />
          </View>
          <View className="w-1/2">
            <InfoItem label="Source" value={formData.sourceOfIncome} />
          </View>
          <View className="w-1/2">
            <InfoItem label="Purpose" value={formData.purpose} />
          </View>
        </View>
      </DataSection>
    </View>
  );
}
