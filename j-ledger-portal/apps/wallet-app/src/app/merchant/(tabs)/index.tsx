import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Store, DollarSign, Activity, CreditCard, ChevronLeft, AlertTriangle, QrCode, ArrowRight } from 'lucide-react-native';
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

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8f9fe]">
        <ActivityIndicator size="large" color="#f48fb1" />
        <Text className="mt-4 text-gray-400 font-manrope font-bold">Loading merchant data...</Text>
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
          <MotiView 
            from={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-24 h-24 bg-pink-50 rounded-[2.5rem] items-center justify-center mb-8 border border-pink-100"
          >
            <Store size={48} color="#f48fb1" />
          </MotiView>
          <Text className="text-2xl font-black font-manrope text-gray-800 text-center mb-3">
            {isPending ? 'Application Pending' : 'Become a Partner'}
          </Text>
          <Text className="text-sm text-gray-400 font-bold text-center mb-10 px-4 leading-5">
            {isPending 
              ? 'Your merchant application is currently being reviewed by our team. We will notify you once it is approved.' 
              : 'Grow your business with J-Ledger. Accept payments, manage terminals, and run loyalty programs directly from your wallet.'}
          </Text>
          
          {!isPending ? (
            <TouchableOpacity 
              onPress={() => router.push('/merchant/apply' as any)}
              className="bg-[#f48fb1] w-full py-5 rounded-2xl shadow-lg shadow-pink-200 active:scale-95"
            >
              <Text className="text-white text-center font-black font-manrope text-base">Start Application</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => router.back()}
              className="bg-white border border-gray-200 w-full py-5 rounded-2xl active:scale-95"
            >
              <Text className="text-gray-400 text-center font-black font-manrope text-base">Back to Profile</Text>
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
      {/* Premium Profile Header - Themed to Pink */}
      <View className="px-6 pt-4 pb-12 bg-[#1a1a1a] rounded-b-[3.5rem] shadow-2xl shadow-black/20">
        <View className="flex-row items-center justify-between mb-8">
          <TouchableOpacity 
            onPress={() => router.replace('/(tabs)' as any)} 
            className="w-10 h-10 bg-white/10 rounded-2xl items-center justify-center border border-white/5"
          >
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-[10px] font-black font-manrope text-white/40 uppercase tracking-[4px]">Merchant Mode</Text>
          <View className="w-10 h-10 bg-[#f48fb1] rounded-2xl items-center justify-center shadow-lg shadow-pink-500/30">
            <Store size={20} color="#ffffff" />
          </View>
        </View>

        <MotiView 
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          className="flex-row items-center"
        >
          <View className="relative">
            <View className="w-20 h-20 bg-[#f48fb1] rounded-[2.5rem] items-center justify-center border-4 border-white/10 shadow-xl shadow-pink-500/20">
              <Text className="text-white font-manrope font-black text-3xl">
                {data?.profile?.name?.charAt(0) || 'M'}
              </Text>
            </View>
            <View className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-[#1a1a1a] items-center justify-center shadow-sm">
              <View className="w-2 h-2 bg-white rounded-full" />
            </View>
          </View>
          
          <View className="ml-5 flex-1">
            <Text className="text-2xl font-black font-manrope text-white tracking-tight" numberOfLines={1}>
              {data?.profile?.name || 'My Merchant'}
            </Text>
            <View className="flex-row items-center mt-2">
              <View className="bg-[#f48fb1]/20 px-3 py-1 rounded-full mr-3 border border-[#f48fb1]/10">
                <Text className="text-[9px] font-black text-[#f48fb1] uppercase tracking-widest">
                  {data?.profile?.category || 'Retail'}
                </Text>
              </View>
              <Text className="text-[10px] text-white/30 font-black uppercase tracking-tighter">
                ID: {data?.merchantId?.substring(0, 8).toUpperCase() || 'N/A'}
              </Text>
            </View>
          </View>
        </MotiView>
      </View>

      <ScrollView 
        className="flex-1 -mt-8"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#f48fb1" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Metric Cards Grid */}
        <View className="flex-row flex-wrap justify-between">
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            className="w-[48%] bg-white p-5 rounded-[2.5rem] mb-4 shadow-xl shadow-pink-100 border border-gray-50 overflow-hidden"
          >
            {/* Glow Background */}
            <View className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-50 rounded-full opacity-60" />
            
            <View className="w-12 h-12 bg-emerald-50 rounded-2xl items-center justify-center mb-5">
              <DollarSign size={24} color="#10b981" />
            </View>
            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Sales Today</Text>
            <View className="flex-row items-baseline">
              <Text className="text-xl font-black font-manrope text-gray-800">฿{data?.totalRevenue?.toLocaleString() || '0'}</Text>
              <Text className="text-[10px] font-bold text-gray-400 ml-0.5">.00</Text>
            </View>
          </MotiView>

          <MotiView 
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 100 }}
            className="w-[48%] bg-white p-5 rounded-[2.5rem] mb-4 shadow-xl shadow-pink-100 border border-gray-50 overflow-hidden"
          >
            {/* Glow Background */}
            <View className="absolute -top-8 -right-8 w-24 h-24 bg-pink-50 rounded-full opacity-60" />

            <View className="w-12 h-12 bg-pink-50 rounded-2xl items-center justify-center mb-5">
              <CreditCard size={24} color="#f48fb1" />
            </View>
            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Available</Text>
            <View className="flex-row items-baseline">
              <Text className="text-xl font-black font-manrope text-gray-800">฿{data?.totalMerchantBalance?.toLocaleString() || '0'}</Text>
              <Text className="text-[10px] font-bold text-gray-400 ml-0.5">.00</Text>
            </View>
          </MotiView>
        </View>

        {/* Quick Actions Grid */}
        <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-5 ml-2 mt-6">Business Operations</Text>
        
        <View className="gap-y-4">
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
          >
            <TouchableOpacity 
              className="w-full bg-[#f48fb1] p-6 rounded-[2.5rem] flex-row items-center justify-between shadow-2xl shadow-pink-300 active:scale-[0.98]"
              onPress={() => router.push('/merchant/receive' as any)}
            >
              <View className="flex-row items-center">
                <View className="w-16 h-16 bg-white/20 rounded-3xl items-center justify-center mr-5 border border-white/10">
                  <QrCode size={32} color="#ffffff" />
                </View>
                <View>
                  <Text className="text-xl font-black font-manrope text-white">Receive Payment</Text>
                  <Text className="text-xs text-white/60 font-bold mt-0.5">Create QR code for customer</Text>
                </View>
              </View>
              <View className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
                <ArrowRight size={20} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </MotiView>

          <View className="flex-row justify-between">
            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: 300 }}
              className="w-[48%]"
            >
              <TouchableOpacity 
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm active:scale-[0.98]"
                onPress={() => router.push('/merchant/transactions' as any)}
              >
                <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center mb-5">
                  <Activity size={24} color="#64748b" />
                </View>
                <Text className="font-manrope font-black text-gray-800 text-sm">Transactions</Text>
                <Text className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">View History</Text>
              </TouchableOpacity>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: 300 }}
              className="w-[48%]"
            >
              <TouchableOpacity 
                className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm active:scale-[0.98]"
                onPress={() => router.push('/merchant/terminals' as any)}
              >
                <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center mb-5">
                  <CreditCard size={24} color="#64748b" />
                </View>
                <Text className="font-manrope font-black text-gray-800 text-sm">Terminals</Text>
                <Text className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">Manage POS</Text>
              </TouchableOpacity>
            </MotiView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
