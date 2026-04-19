import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DealHeader } from '@/components/deal/DealHeader';
import { PointsBalanceCard } from '@/components/deal/PointsBalanceCard';
import { DealCard } from '@/components/deal/DealCard';


export const MOCK_DEALS = [
  {
    id: '1',
    title: '50% OFF STARBUCKS',
    subtitle: 'Exclusive for J-Ledger Premium',
    image: require('../../../assets/images/deal_starbucks.png'),
    tag: 'LIMITED',
    points: 500,
    desc: 'Get 50% discount on any handcrafted beverage at Starbucks. Valid for Grande and Venti sizes only.',
  },
  {
    id: '2',
    title: 'DOUBLE POINTS FRIDAY',
    subtitle: 'Earn 2x rewards on every Scan Pay',
    image: require('../../../assets/images/deal_points.png'),
    tag: 'HOT DEAL',
    points: 100,
    desc: 'Activate this deal to earn double reward points on all Scan Pay transactions this coming Friday.',
  },
  {
    id: '3',
    title: 'GRABFOOD ฿100 OFF',
    subtitle: 'Minimum spend of ฿500 via Wallet',
    image: require('../../../assets/images/deal_grabfood.png'),
    tag: 'POPULAR',
    points: 300,
    desc: 'Discount code ฿100 for your next GrabFood order when paying with J-Ledger Wallet.',
  },
];

export default function DealsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <DealHeader
        title="Today's Deals"
        showGift
        onGiftPress={() => router.push('/deal/my-deals' as any)}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <PointsBalanceCard points={1250} onMyDealsPress={() => router.push('/deal/my-deals' as any)} />

        <Text className="text-[11px] font-manrope font-black text-[#f48fb1] uppercase tracking-widest mb-6 px-1">
          Exclusive Rewards
        </Text>

        <View className="gap-y-6">
          {MOCK_DEALS.map((deal, idx) => (
            <DealCard
              key={deal.id}
              {...deal}
              index={idx}
              onPress={() => router.push(`/deal/${deal.id}` as any)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
