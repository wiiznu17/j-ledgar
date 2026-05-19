import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

interface TransactionAmountCardProps {
  amount: string;
  onAmountChange: (text: string) => void;
  label?: string;
  quickAmounts?: string[];
  minAmount?: number;
  accentColor?: string;
}

/**
 * A standardized card for transaction amount input.
 * Designed for stability by avoiding NativeWind complex shadow classes.
 */
export const TransactionAmountCard: React.FC<TransactionAmountCardProps> = ({
  amount,
  onAmountChange,
  label = 'Enter Amount',
  quickAmounts = ['100', '500', '1,000'],
  minAmount = 5.0,
  accentColor = '#f48fb1',
}) => {
  const handleTextChange = (text: string) => {
    // Only allow numbers and one decimal point
    const filtered = text.replace(/[^0-9.]/g, '');
    if (filtered.split('.').length > 2) return;
    onAmountChange(filtered);
  };

  const handleQuickSelect = (val: string) => {
    onAmountChange(val.replace(',', ''));
    Haptics.selectionAsync();
  };

  const isTooSmall = amount !== '' && parseFloat(amount) < minAmount;

  return (
    <View
      className="bg-white rounded-[2.5rem] p-8 mb-6 items-center border border-gray-50 relative overflow-hidden"
      style={{
        // Stable shadow implementation to prevent context loss in NativeWind 4
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* Background Decoration */}
      <View
        className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10"
        style={{ backgroundColor: accentColor }}
      />

      <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-4">
        {label}
      </Text>

      <View
        className="flex-row items-center justify-center border-b-2 pb-2 mb-6 w-full max-w-[220px]"
        style={{ borderBottomColor: isTooSmall ? '#fca5a5' : '#fce7f3' }}
      >
        <Text className="text-2xl font-manrope font-black text-gray-400 mr-2">
          ฿
        </Text>
        <TextInput
          placeholder="0.00"
          placeholderTextColor="#d1d5db"
          value={amount}
          onChangeText={handleTextChange}
          keyboardType="decimal-pad"
          selectionColor={accentColor}
          className="font-manrope font-black text-center"
          style={{
            fontSize: 44,
            minWidth: 120,
            color: isTooSmall ? '#ef4444' : accentColor,
            height: 60,
            includeFontPadding: false,
          }}
          maxLength={9}
        />
      </View>

      {isTooSmall && (
        <Text className="text-[10px] font-manrope font-bold text-red-400 mb-6 uppercase tracking-wider">
          Minimum amount is ฿{minAmount.toFixed(2)}
        </Text>
      )}

      {/* Quick Select Buttons */}
      <View className="flex-row gap-3">
        {quickAmounts.map((val) => (
          <TouchableOpacity
            key={val}
            onPress={() => handleQuickSelect(val)}
            className="px-5 py-3 rounded-2xl border active:scale-95"
            style={{
              backgroundColor: `${accentColor}10`,
              borderColor: `${accentColor}20`,
            }}
          >
            <Text
              className="text-[11px] font-manrope font-black"
              style={{ color: accentColor }}
            >
              {val}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
