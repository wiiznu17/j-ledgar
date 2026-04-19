import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import {
  Smartphone,
  ReceiptText,
  Gamepad2,
  ShieldCheck,
  CreditCard,
  Car,
  TicketPercent,
  LayoutGrid,
} from 'lucide-react-native';

interface ServicesGridProps {
  onServicePress: (route?: string) => void;
}

export const ServicesGrid = ({ onServicePress }: ServicesGridProps) => {
  const renderServiceItem = (
    icon: any,
    label: string,
    color: string,
    route?: string,
    comingSoon?: boolean,
  ) => (
    <TouchableOpacity
      onPress={() => !comingSoon && onServicePress(route)}
      className={`items-center w-1/4 mb-6 ${comingSoon ? 'opacity-50' : ''}`}
      activeOpacity={comingSoon ? 1 : 0.7}
    >
      <MotiView
        from={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-14 h-14 rounded-[1.2rem] bg-white items-center justify-center shadow-sm border border-gray-50 mb-2 relative"
      >
        {React.cloneElement(icon, { size: 24, color: color })}
        {comingSoon && (
          <View className="absolute -top-1.5 -right-1.5 bg-gray-400 px-1.5 py-0.5 rounded-md shadow-sm">
            <Text className="text-[7px] font-black text-white uppercase tracking-widest">Soon</Text>
          </View>
        )}
      </MotiView>
      <Text className="text-[11px] font-manrope font-bold text-gray-500 text-center tracking-tight">
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="bg-white rounded-[2rem] p-6 border border-gray-50 shadow-sm mb-4">
      <View className="flex-row flex-wrap -mx-2 justify-between">
        {renderServiceItem(<Smartphone />, 'Top-up', '#3b82f6', '/topup')}
        {renderServiceItem(<ReceiptText />, 'Bills', '#f97316', undefined, true)}
        {renderServiceItem(<Gamepad2 />, 'Games', '#a855f7', undefined, true)}
        {renderServiceItem(<ShieldCheck />, 'Insurance', '#22c55e', undefined, true)}
        {renderServiceItem(<CreditCard />, 'K-Debit', '#14b8a6', undefined, true)}
        {renderServiceItem(<Car />, 'Transport', '#2563eb', undefined, true)}
        {renderServiceItem(<TicketPercent />, 'Deals', '#ec4899', '/deals')}
        {renderServiceItem(<LayoutGrid />, 'Others', '#64748b', undefined, true)}
      </View>
    </View>
  );
};
