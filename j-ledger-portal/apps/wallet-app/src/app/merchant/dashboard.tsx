import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Store, DollarSign, Activity, CreditCard, ChevronLeft, AlertTriangle } from 'lucide-react-native';
import { MerchantService, MerchantDashboardData } from '@/lib/merchant-service';

export default function MerchantDashboard() {
  const router = useRouter();
  const [data, setData] = useState<MerchantDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  const fetchDashboard = async () => {
    try {
      setErrorStatus(null);
      const res = await MerchantService.getDashboard();
      setData(res);
    } catch (error: any) {
      console.error('[Merchant Dashboard] Fetch Error:', error);
      if (error?.response?.status) {
        setErrorStatus(error.response.status);
      } else {
        setErrorStatus(500);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8f9fe]">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="mt-4 text-gray-500 font-manrope font-bold">Loading merchant data...</Text>
      </SafeAreaView>
    );
  }

  // Handle Non-Merchant or Pending status
  if (data && !data.isMerchant) {
    const isPending = data.applicationStatus === 'PENDING';

    return (
      <SafeAreaView className="flex-1 bg-[#f8f9fe]">
        <View className="flex-row items-center px-4 py-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-xl font-black font-manrope text-gray-800 ml-2">Merchant Partner</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-amber-50 rounded-3xl items-center justify-center mb-6 border border-amber-100">
            <Store size={40} color="#f59e0b" />
          </View>
          <Text className="text-2xl font-black font-manrope text-gray-800 text-center mb-2">
            {isPending ? 'Application Pending' : 'Become a Partner'}
          </Text>
          <Text className="text-sm text-gray-500 font-bold text-center mb-8 px-4">
            {isPending 
              ? 'Your merchant application is currently being reviewed by our team. We will notify you once it is approved.' 
              : 'Grow your business with J-Ledger. Accept payments, manage terminals, and run loyalty programs directly from your wallet.'}
          </Text>
          
          {!isPending ? (
            <TouchableOpacity 
              onPress={() => router.push('/merchant/apply' as any)}
              className="bg-gray-900 w-full py-4 rounded-2xl shadow-lg shadow-gray-200"
            >
              <Text className="text-white text-center font-black font-manrope">Start Application</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => router.back()}
              className="bg-white border border-gray-200 w-full py-4 rounded-2xl"
            >
              <Text className="text-gray-500 text-center font-black font-manrope">Back to Profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Handle actual API errors
  if (errorStatus) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8f9fe]">
        <View className="flex-row items-center px-4 py-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-xl font-black font-manrope text-gray-800 ml-2">Merchant Mode</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-6">
            <AlertTriangle size={40} color="#ef4444" />
          </View>
          <Text className="text-2xl font-black font-manrope text-gray-800 text-center mb-2">System Error</Text>
          <Text className="text-sm text-gray-500 font-bold text-center mb-8">
            Unable to connect to merchant services. Please try again later.
          </Text>
          <TouchableOpacity 
            onPress={fetchDashboard}
            className="bg-gray-900 px-8 py-4 rounded-2xl"
          >
            <Text className="text-white font-black font-manrope">Retry Connection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-xl font-black font-manrope text-gray-800">Merchant Dashboard</Text>
        </View>
        <View className="w-10 h-10 bg-amber-50 rounded-xl items-center justify-center border border-amber-100">
          <Store size={20} color="#f59e0b" />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
      >
        {/* Metric Cards */}
        <View className="flex-row flex-wrap justify-between">
          
          <View className="w-[48%] bg-white p-4 rounded-3xl shadow-sm mb-4 border border-gray-100">
            <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center mb-3">
              <DollarSign size={20} color="#10b981" />
            </View>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Revenue</Text>
            <Text className="text-xl font-black font-manrope text-gray-800">฿{data?.totalRevenue?.toLocaleString() || '0'}</Text>
          </View>

          <View className="w-[48%] bg-white p-4 rounded-3xl shadow-sm mb-4 border border-gray-100">
            <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mb-3">
              <Activity size={20} color="#3b82f6" />
            </View>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Transactions</Text>
            <Text className="text-xl font-black font-manrope text-gray-800">{data?.totalTransactions || 0}</Text>
          </View>

          <View className="w-[100%] bg-white p-4 rounded-3xl shadow-sm mb-6 border border-gray-100 flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Active Terminals</Text>
              <Text className="text-xl font-black font-manrope text-gray-800">{data?.activeTerminals || 0} Devices</Text>
            </View>
            <View className="w-12 h-12 bg-purple-50 rounded-2xl items-center justify-center">
              <CreditCard size={24} color="#8b5cf6" />
            </View>
          </View>

        </View>

        {/* Quick Actions */}
        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Quick Actions</Text>
        <View className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden mb-6">
          <TouchableOpacity 
            className="flex-row items-center justify-between p-5 border-b border-gray-50"
            onPress={() => router.push('/merchant/transactions' as any)}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-4">
                <Activity size={20} color="#64748b" />
              </View>
              <Text className="font-manrope font-black text-gray-800">View All Transactions</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center justify-between p-5"
            onPress={() => router.push('/merchant/terminals' as any)}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-slate-50 rounded-xl items-center justify-center mr-4">
                <CreditCard size={20} color="#64748b" />
              </View>
              <Text className="font-manrope font-black text-gray-800">Manage Terminals</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
