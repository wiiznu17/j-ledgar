import React from 'react';
import { ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Components
import { HomeHeader } from '@/components/home/HomeHeader';
import { WelcomeHeader } from '@/components/home/WelcomeHeader';
import { DashboardSection } from '@/components/home/DashboardSection';
import { ServicesGrid } from '@/components/home/ServicesGrid';
import { PromoBanners } from '@/components/home/PromoBanners';
import { RecentActivityList } from '@/components/home/RecentActivityList';

const { width } = Dimensions.get('window');

// Mock Data
const MOCK_USER = {
  name: 'Alex Johnson',
  balance: 45000.0,
  currency: '฿',
  points: 1250,
  avatar: require('../../../assets/images/mock_user_avatar.png'),
  kycStatus: 'PENDING',
};

const RECENT_TRANSACTIONS = [
  {
    id: '1',
    title: 'Gourmet Groceries',
    category: 'Shopping',
    amount: 1240,
    type: 'expense',
    time: '10:24 AM',
  },
  {
    id: '2',
    title: 'Salary Deposit',
    category: 'Deposit',
    amount: 45000,
    type: 'income',
    time: 'Yesterday',
  },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      {/* Header Section */}
      <HomeHeader />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <WelcomeHeader user={MOCK_USER} />

        {/* Dashboard Section */}
        <DashboardSection
          balance={MOCK_USER.balance}
          points={MOCK_USER.points}
          currency={MOCK_USER.currency}
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
          transactions={RECENT_TRANSACTIONS}
          currency={MOCK_USER.currency}
          onSeeAll={() => router.push('/(tabs)/history' as any)}
          onTransactionPress={(tx) => console.log('Transaction pressed:', tx.id)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
