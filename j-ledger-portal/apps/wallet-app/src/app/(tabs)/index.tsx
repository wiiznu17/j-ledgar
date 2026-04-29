import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, Dimensions, ActivityIndicator, View, Text, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '@/lib/axios';

// Components
import { HomeHeader } from '@/components/home/HomeHeader';
import { WelcomeHeader } from '@/components/home/WelcomeHeader';
import { DashboardSection } from '@/components/home/DashboardSection';
import { ServicesGrid } from '@/components/home/ServicesGrid';
import { PromoBanners } from '@/components/home/PromoBanners';
import { RecentActivityList } from '@/components/home/RecentActivityList';
import { useAuthStore } from '@/store/auth';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Dashboard data from API
  const [userName, setUserName] = useState('J-Ledger User');
  const [kycStatus, setKycStatus] = useState('NOT_STARTED');
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('฿');
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;

    try {
      // Uses `api` client which auto-refreshes token on 401
      const res = await api.get('/integration/dashboard');
      
      const data = res.data;

      // User info
      setUserName(data.user?.name || 'J-Ledger User');
      setKycStatus(data.user?.kycStatus || 'NOT_STARTED');

      // Wallet info
      if (data.wallet) {
        setBalance(data.wallet.balance || 0);
        setCurrency(data.wallet.currency === 'THB' ? '฿' : data.wallet.currency);
      }

      // Transactions
      setRecentTransactions(data.recentTransactions || []);
      setError('');
    } catch (err: any) {
      console.error('[Dashboard] Failed to fetch:', err.response?.data || err.message);

      // If token is expired or invalid, force re-login
      if (err.response?.status === 401) {
        console.warn('[Dashboard] Token expired, redirecting to login...');
        await logout();
        router.replace('/(auth)/login' as any);
        return;
      }

      setError('ไม่สามารถโหลดข้อมูลได้');
    }
  }, [token, logout, router]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchDashboard();
      setIsLoading(false);
    };
    load();
  }, [fetchDashboard]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDashboard();
    setIsRefreshing(false);
  }, [fetchDashboard]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8f9fe] items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#f48fb1" />
        <Text className="text-sm font-manrope font-bold text-gray-400 mt-4">
          กำลังโหลดข้อมูล...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      {/* Header Section */}
      <HomeHeader />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#f48fb1" />
        }
      >
        {/* Welcome Section */}
        <WelcomeHeader user={{ name: userName, avatar: require('../../../assets/images/mock_user_avatar.png') }} />

        {/* Error Banner */}
        {error ? (
          <View className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
            <Text className="text-xs font-manrope font-bold text-red-500 text-center">{error}</Text>
          </View>
        ) : null}

        {/* Dashboard Section */}
        <DashboardSection
          balance={balance}
          points={0}
          currency={currency}
          onTransfer={() => router.push('/transfer' as any)}
          onTopUp={() => router.push('/topup' as any)}
          onMyQR={() => router.push('/my-qr' as any)}
          onHistory={() => router.push('/(tabs)/history' as any)}
          onRedeem={() => {}}
        />

        {/* Services Section */}
        <ServicesGrid onServicePress={(route) => route && router.push(route as any)} />

        {/* Promotional Banners */}
        <PromoBanners onPromoPress={(id) => console.log('Promo pressed:', id)} />

        {/* Recent Activity */}
        <RecentActivityList
          transactions={recentTransactions}
          currency={currency}
          onSeeAll={() => router.push('/(tabs)/history' as any)}
          onTransactionPress={(tx) => console.log('Transaction pressed:', tx.id)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
