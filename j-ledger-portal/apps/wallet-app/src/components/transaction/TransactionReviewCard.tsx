import React from 'react';
import { View, Text } from 'react-native';
import { Wallet, Store, UserCircle } from 'lucide-react-native';

interface TransactionReviewCardProps {
  amount: number;
  fromName?: string;
  toName: string;
  toType: 'merchant' | 'user';
  transactionType: string;
  fee?: number;
  note?: string;
  accentColor?: string;
}

/**
 * A standardized card for reviewing transaction details before confirmation.
 * Supports both merchant payments and user transfers.
 */
export const TransactionReviewCard: React.FC<TransactionReviewCardProps> = ({
  amount,
  fromName = 'My E-Wallet',
  toName,
  toType,
  transactionType,
  fee = 0,
  note,
  accentColor = '#f48fb1',
}) => {
  const totalAmount = amount + fee;

  return (
    <View
      className="bg-white rounded-[2.5rem] p-7 border border-gray-100 relative overflow-hidden mb-6"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 1,
      }}
    >
      {/* Top Accent Bar */}
      <View
        className="absolute top-0 left-0 right-0 h-2"
        style={{ backgroundColor: accentColor }}
      />

      {/* Amount Display Section */}
      <View className="items-center mb-8 pt-4">
        <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-3">
          Payment Amount
        </Text>
        <View className="flex-row items-baseline w-full justify-center">
          <Text className="text-2xl font-manrope font-black text-gray-400 mr-2">
            ฿
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            className="text-5xl font-manrope font-black text-gray-800 tracking-tighter"
          >
            {amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>

      {/* From -> To Direction Section */}
      <View
        className="rounded-[2rem] p-5 border border-gray-100/50 mb-8 relative"
        style={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
      >
        <View className="absolute left-10 top-12 bottom-12 w-[2px] bg-gray-200 border-dashed border-l-[2px] border-gray-200 z-0" />

        {/* Sender Information */}
        <View className="flex-row items-center relative z-10 mb-6">
          <View className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-gray-100 shadow-sm">
            <Wallet size={20} color="#9ca3af" />
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-0.5">
              From
            </Text>
            <Text className="text-sm font-manrope font-black text-gray-800">
              {fromName}
            </Text>
          </View>
        </View>

        {/* Recipient Information */}
        <View className="flex-row items-center relative z-10">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center border shadow-sm"
            style={{
              backgroundColor: toType === 'merchant' ? '#fff1f2' : '#fdf2f8',
              borderColor: toType === 'merchant' ? '#ffe4e6' : '#fce7f3',
            }}
          >
            {toType === 'merchant' ? (
              <Store size={20} color={accentColor} />
            ) : (
              <UserCircle size={20} color={accentColor} />
            )}
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-0.5">
              To {toType === 'merchant' ? 'Merchant' : 'Recipient'}
            </Text>
            <Text
              className="text-sm font-manrope font-black text-gray-800"
              numberOfLines={1}
            >
              {toName}
            </Text>
          </View>
        </View>
      </View>

      {/* Detailed Summary Section */}
      <View className="space-y-4">
        <SummaryRow label="Transaction Type" value={transactionType} />
        <SummaryRow
          label="Transaction Fee"
          value={fee === 0 ? 'FREE' : `฿${fee.toFixed(2)}`}
          isHighlight={fee === 0}
        />
        {note ? <SummaryRow label="Note" value={note} /> : null}

        {/* Total Highlight */}
        <View className="mt-2 pt-5 border-t border-gray-100 flex-row justify-between items-center">
          <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest">
            Total Payment
          </Text>
          <Text
            className="text-xl font-manrope font-black"
            style={{ color: accentColor }}
          >
            ฿
            {totalAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>
    </View>
  );
};

/** Internal helper for summary rows */
function SummaryRow({
  label,
  value,
  isHighlight,
}: {
  label: string;
  value: string;
  isHighlight?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest">
        {label}
      </Text>
      <Text
        className={`text-sm font-manrope font-black ${
          isHighlight ? 'text-green-500' : 'text-gray-800'
        }`}
      >
        {value}
      </Text>
    </View>
  );
}
