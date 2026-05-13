import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, ArrowDownLeft, Receipt, Filter } from 'lucide-react-native';
import { MerchantService, MerchantTransaction } from '@/lib/merchant-service';

export default function MerchantTransactions() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<MerchantTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Basic filter
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED'>('ALL');

  const fetchTransactions = async (statusFilter?: string) => {
    try {
      const params = statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const res = await MerchantService.getTransactions(params);
      setTransactions(res.data || []);
    } catch (error) {
      console.error('[Merchant Transactions] Fetch Error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchTransactions(activeFilter);
    }, [activeFilter])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchTransactions(activeFilter);
  };

  const renderFilterButton = (label: string, value: 'ALL' | 'SUCCESS' | 'FAILED') => (
    <TouchableOpacity
      onPress={() => setActiveFilter(value)}
      className={`px-4 py-2 rounded-full border ${
        activeFilter === value 
          ? 'bg-gray-900 border-gray-900' 
          : 'bg-white border-gray-200'
      }`}
    >
      <Text className={`text-xs font-bold font-manrope ${
        activeFilter === value ? 'text-white' : 'text-gray-500'
      }`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTransaction = ({ item }: { item: MerchantTransaction }) => {
    const isSuccess = item.status === 'COMPLETED' || item.status === 'SUCCESS';
    const isFailed = item.status === 'FAILED' || item.status === 'CANCELLED';

    return (
      <View className="bg-white p-4 rounded-[1.5rem] mb-3 border border-gray-100 flex-row items-center justify-between shadow-sm">
        <View className="flex-row items-center flex-1">
          <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
            isSuccess ? 'bg-emerald-50' : isFailed ? 'bg-red-50' : 'bg-gray-50'
          }`}>
            <ArrowDownLeft size={20} color={isSuccess ? '#10b981' : isFailed ? '#ef4444' : '#6b7280'} />
          </View>
          <View className="flex-1">
            <Text className="font-manrope font-black text-gray-800 text-base" numberOfLines={1}>
              {item.type || 'Payment Received'}
            </Text>
            <Text className="text-xs text-gray-400 font-medium mt-1">
              {new Date(item.createdAt).toLocaleString()}
            </Text>
            {item.referenceId && (
              <Text className="text-[10px] text-gray-300 font-bold mt-1">Ref: {item.referenceId}</Text>
            )}
          </View>
        </View>
        <View className="items-end">
          <Text className="font-manrope font-black text-lg text-gray-900">
            +฿{item.amount.toLocaleString()}
          </Text>
          <Text className={`text-[10px] font-black uppercase tracking-wider mt-1 ${
            isSuccess ? 'text-emerald-500' : isFailed ? 'text-red-500' : 'text-amber-500'
          }`}>
            {item.status}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-xl font-black font-manrope text-gray-800">Transactions</Text>
        </View>
      </View>

      {/* Filters */}
      <View className="px-5 mb-4 flex-row items-center gap-2">
        <View className="bg-gray-100 p-2 rounded-full mr-1">
          <Filter size={16} color="#6b7280" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {renderFilterButton('All', 'ALL')}
          <View className="w-2" />
          {renderFilterButton('Success', 'SUCCESS')}
          <View className="w-2" />
          {renderFilterButton('Failed', 'FAILED')}
          <View className="w-4" />
        </ScrollView>
      </View>

      {/* List */}
      {isLoading && !isRefreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          onRefresh={onRefresh}
          refreshing={isRefreshing}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
                <Receipt size={32} color="#9ca3af" />
              </View>
              <Text className="font-manrope font-bold text-gray-400 text-base">No transactions found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
