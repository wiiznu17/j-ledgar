import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, AlertCircle, Bell } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import {
  formatCreatedAt,
  getAmountColor,
  getTypeMeta,
  type HistoryItem,
} from '@/features/history/presentation';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; payload?: string }>();

  // Parse payload if available (from app navigation)
  const initialTransaction: HistoryItem | null = React.useMemo(() => {
    if (!params.payload || typeof params.payload !== 'string') {
      return null;
    }
    try {
      const parsed = JSON.parse(params.payload) as HistoryItem;
      return parsed;
    } catch (err) {
      return null;
    }
  }, [params.payload, params.id]);

  // Fetch transaction from API if payload is missing (from notification/deep link)
  const {
    data: fetchedTransaction,
    isLoading,
    isError,
    error: apiError,
  } = useQuery({
    queryKey: ['transaction', params.id],
    queryFn: async () => {
      const url = `/integration/transactions/details/${params.id}`;
      try {
        const { data } = await api.get(url);
        return data;
      } catch (err: any) {
        throw err;
      }
    },
    enabled: !!params.id && !initialTransaction,
  });

  const transaction = initialTransaction || fetchedTransaction;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-transparent items-center justify-center">
        <ActivityIndicator size="large" color="#4855a5" />
        <Text className="font-manrope font-bold text-gray-400 mt-4">
          Loading transaction details...
        </Text>
      </SafeAreaView>
    );
  }

  if (!transaction || isError) {
    return (
      <SafeAreaView className="flex-1 bg-transparent items-center justify-center p-6">
        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
          <Bell size={40} color="#9ca3af" />
        </View>
        <Text className="text-xl font-manrope font-black text-gray-800 text-center">
          Transaction not found
        </Text>
        <Text className="text-sm font-manrope font-medium text-gray-500 text-center mt-2">
          We couldn't find the details for this transaction. It might still be processing or has
          been removed.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-8 px-10 py-4 bg-[#4855a5] rounded-2xl shadow-lg shadow-blue-200"
        >
          <Text className="font-manrope font-black text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const Icon = getTypeMeta(transaction.type).icon;
  const amountColor = getAmountColor(transaction.direction, transaction.status);

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
          Transaction Details
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="mt-2"
        >
          <View className="bg-white rounded-[2.5rem] p-6 border border-gray-50 shadow-xl shadow-pink-100/40 mb-6 overflow-hidden">
            <View className="items-center mb-6 pt-2">
              <View className="w-16 h-16 rounded-[1.5rem] items-center justify-center mb-4 border shadow-sm bg-pink-50 border-pink-100">
                <Icon size={28} color="#f48fb1" />
              </View>
              <Text className="text-xl font-manrope font-black text-gray-800 tracking-tight">
                {transaction.title}
              </Text>
              <Text className="text-[10px] font-manrope font-bold text-gray-400 mt-1 uppercase tracking-widest">
                {getTypeMeta(transaction.type).label}
              </Text>
            </View>

            <View className="items-center py-8 border-y border-dashed border-gray-200 mb-6">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-2">
                Amount
              </Text>
              <View className="flex-row items-center justify-center w-full">
                <Text
                  className="text-3xl font-manrope font-black mr-1 mt-1"
                  style={{ color: amountColor }}
                >
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
              <DetailRow label="Date & Time" value={formatCreatedAt(transaction.createdAt)} />
              <DetailRow label="Source" value={transaction.source} />
              <DetailRow label="Reference ID" value={transaction.reference || transaction.id} />
              {transaction.paymentIntentId ? (
                <DetailRow label="Payment Intent" value={transaction.paymentIntentId} />
              ) : null}
              {transaction.orderId ? (
                <DetailRow label="Order ID" value={transaction.orderId} />
              ) : null}
            </View>
          </View>

          {/* View Receipt Button */}
          <TouchableOpacity
            onPress={() =>
              router.push(`/billing/${transaction.reference || transaction.id}` as any)
            }
            className="w-full h-16 bg-white border-2 border-[#f48fb1] rounded-2xl flex-row items-center justify-center gap-2 mb-4 active:scale-95"
          >
            <Text className="text-sm font-manrope font-black text-[#f48fb1]">View Receipt</Text>
          </TouchableOpacity>

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
      <Text
        className="text-sm font-manrope font-black flex-1 text-right"
        style={{ color: valueColor }}
      >
        {value}
      </Text>
    </View>
  );
}
