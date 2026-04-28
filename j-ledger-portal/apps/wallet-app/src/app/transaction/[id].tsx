import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, AlertCircle } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { formatOccurredAt, getAmountColor, getKindMeta, type HistoryItem } from '@/features/history/presentation';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; payload?: string }>();

  const transaction: HistoryItem | null = (() => {
    if (!params.payload || typeof params.payload !== 'string') {
      return null;
    }
    try {
      return JSON.parse(params.payload) as HistoryItem;
    } catch {
      return null;
    }
  })();

  if (!transaction) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8f9fe] items-center justify-center">
        <Text className="font-manrope font-black text-gray-500">Transaction not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-6 py-3 bg-pink-50 rounded-xl">
          <Text className="font-manrope font-black text-[#f48fb1]">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const Icon = getKindMeta(transaction.kind).icon;
  const amountColor = getAmountColor(transaction.direction, transaction.status);

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">Transaction Details</Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} className="mt-2">
          <View className="bg-white rounded-[2.5rem] p-6 border border-gray-50 shadow-xl shadow-pink-100/40 mb-6 overflow-hidden">
            <View className="items-center mb-6 pt-2">
              <View className="w-16 h-16 rounded-[1.5rem] items-center justify-center mb-4 border shadow-sm bg-pink-50 border-pink-100">
                <Icon size={28} color="#f48fb1" />
              </View>
              <Text className="text-xl font-manrope font-black text-gray-800 tracking-tight">{transaction.title}</Text>
              <Text className="text-[10px] font-manrope font-bold text-gray-400 mt-1 uppercase tracking-widest">
                {getKindMeta(transaction.kind).label}
              </Text>
            </View>

            <View className="items-center py-8 border-y border-dashed border-gray-200 mb-6">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-2">Amount</Text>
              <View className="flex-row items-center justify-center w-full">
                <Text className="text-3xl font-manrope font-black mr-1 mt-1" style={{ color: amountColor }}>
                  {transaction.direction === 'OUT' ? '-' : '+'}฿
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                  className="text-5xl font-manrope font-black tracking-tighter"
                  style={{ color: amountColor, lineHeight: 60, includeFontPadding: false }}
                >
                  {Number(transaction.amount || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>

            <View className="gap-y-4 pb-2">
              <DetailRow label="Status" value={transaction.status} valueColor={amountColor} />
              <DetailRow label="Date & Time" value={formatOccurredAt(transaction.occurredAt)} />
              <DetailRow label="Source" value={transaction.source} />
              <DetailRow label="Reference ID" value={transaction.reference || transaction.id} />
              {transaction.paymentIntentId ? <DetailRow label="Payment Intent" value={transaction.paymentIntentId} /> : null}
              {transaction.orderId ? <DetailRow label="Order ID" value={transaction.orderId} /> : null}
            </View>
          </View>

          <TouchableOpacity className="bg-red-50 p-4 rounded-2xl border border-red-100 flex-row items-center justify-center gap-2 shadow-sm active:scale-95 mb-6">
            <AlertCircle size={16} color="#ef4444" />
            <Text className="text-xs font-manrope font-black text-red-500 uppercase tracking-widest">
              Report an issue
            </Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  valueColor = '#1f2937',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest flex-1">
        {label}
      </Text>
      <Text className="text-sm font-manrope font-black flex-1 text-right" style={{ color: valueColor }}>
        {value}
      </Text>
    </View>
  );
}
