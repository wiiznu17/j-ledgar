import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

export interface DataSectionProps {
  title: string;
  icon: React.ReactElement<any>;
  onEdit: () => void;
  children: React.ReactNode;
}

export function DataSection({ title, icon, onEdit, children }: DataSectionProps) {
  return (
    <View className="bg-white rounded-[2rem] p-5 border border-gray-50 shadow-sm relative group">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-2xl bg-gray-50 items-center justify-center border border-gray-100">
            {React.cloneElement(icon, { size: 20 })}
          </View>
          <Text className="font-manrope font-black text-gray-800 text-base">{title}</Text>
        </View>
        <TouchableOpacity onPress={onEdit} className="px-3 py-1.5 bg-pink-50 rounded-xl">
          <Text className="font-black text-[10px] uppercase tracking-widest text-[#f48fb1]">
            Edit
          </Text>
        </TouchableOpacity>
      </View>
      <View>{children}</View>
    </View>
  );
}

export function InfoItem({
  label,
  value,
  valueClass,
}: {
  label: string;
  value?: string;
  valueClass?: string;
}) {
  return (
    <View className="space-y-0.5">
      <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
        {label}
      </Text>
      <Text className={`text-sm font-bold text-gray-800 ${valueClass || ''}`}>{value || '-'}</Text>
    </View>
  );
}

export interface EditFieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
}

export function EditField({ label, icon, value, onChange, disabled }: EditFieldProps) {
  return (
    <View className="space-y-1.5 w-full">
      <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
        {label}
      </Text>
      <View
        className={`h-14 px-4 bg-gray-50 border border-gray-100 rounded-2xl flex-row items-center gap-3 ${disabled ? 'opacity-50' : ''}`}
      >
        {icon}
        <TextInput
          editable={!disabled}
          value={value}
          onChangeText={onChange}
          className="flex-1 font-manrope font-bold text-sm text-gray-800"
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor="#9ca3af"
        />
      </View>
    </View>
  );
}

export interface EditSelectProps {
  label: string;
  icon: React.ReactNode;
  value: string;
}

// Fixed import for ChevronRight if needed, but since it's used in atoms, I'll pass it or import lucide
import { ChevronRight as ChevronIcon } from 'lucide-react-native';

export function EditSelect({ label, icon, value }: EditSelectProps) {
  return (
    <View className="space-y-1.5 w-full">
      <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
        {label}
      </Text>
      <TouchableOpacity className="h-14 px-4 bg-gray-50 border border-gray-100 rounded-2xl flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          {icon}
          <Text className="font-manrope font-bold text-sm text-gray-800">{value}</Text>
        </View>
        <ChevronIcon size={18} color="#9ca3af" className="rotate-90" />
      </TouchableOpacity>
    </View>
  );
}
