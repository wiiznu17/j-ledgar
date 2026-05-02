import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { DealHeader } from '@/components/deal/DealHeader';
import { PointsBalanceCard } from '@/components/deal/PointsBalanceCard';
import { DealCard } from '@/components/deal/DealCard';

export default function DealsScreen() {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // 1. Fetch Points Balance
  const { data: balanceData } = useQuery({
    queryKey: ['loyalty-balance'],
    queryFn: async () => {
      const { data } = await api.get('/loyalty/balance');
      return data;
    },
  });

  // 2. Fetch Categories
  const { data: categories } = useQuery({
    queryKey: ['deal-categories'],
    queryFn: async () => {
      const { data } = await api.get('/deals/categories');
      return data;
    },
  });

  // 3. Fetch Deals
  const { data: deals, isLoading, isError } = useQuery({
    queryKey: ['deals', selectedCategoryId],
    queryFn: async () => {
      const url = selectedCategoryId ? `/deals?categoryId=${selectedCategoryId}` : '/deals';
      const { data } = await api.get(url);
      return data;
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
      <DealHeader
        title="Today's Deals"
        showGift
        onGiftPress={() => router.push('/deal/my-deals' as any)}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5">
          <PointsBalanceCard
            points={balanceData?.balance || 0}
            onMyDealsPress={() => router.push('/deal/my-deals' as any)}
          />
        </View>

        {/* Category Selector */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, marginBottom: 24 }}
        >
          <TouchableOpacity 
            onPress={() => setSelectedCategoryId(null)}
            className={`px-6 py-3 rounded-2xl mr-3 ${!selectedCategoryId ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-100'}`}
          >
            <Text className={`font-manrope font-black text-[10px] uppercase tracking-widest ${!selectedCategoryId ? 'text-white' : 'text-gray-400'}`}>
              All
            </Text>
          </TouchableOpacity>
          {categories?.map((cat: any) => (
            <TouchableOpacity 
              key={cat.id}
              onPress={() => setSelectedCategoryId(cat.id)}
              className={`px-6 py-3 rounded-2xl mr-3 ${selectedCategoryId === cat.id ? 'bg-[#1a1a1a]' : 'bg-white border border-gray-100'}`}
            >
              <Text className={`font-manrope font-black text-[10px] uppercase tracking-widest ${selectedCategoryId === cat.id ? 'text-white' : 'text-gray-400'}`}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="px-5">
          <Text className="text-[11px] font-manrope font-black text-[#f48fb1] uppercase tracking-widest mb-6 px-1">
            Exclusive Rewards
          </Text>

          {isLoading ? (
            <ActivityIndicator color="#f48fb1" className="mt-10" />
          ) : isError ? (
            <Text className="text-center text-gray-400 font-manrope font-bold mt-10">Failed to load deals</Text>
          ) : deals?.length === 0 ? (
            <Text className="text-center text-gray-400 font-manrope font-bold mt-10">No deals available in this category</Text>
          ) : (
            <View className="gap-y-6">
              {deals?.map((deal: any, idx: number) => (
                <DealCard
                  key={deal.id}
                  id={deal.id}
                  title={deal.title}
                  subtitle={deal.brand?.name || 'Partner Offer'}
                  image={deal.imageUrl}
                  tag={deal.priority > 5 ? 'HOT DEAL' : 'LIMITED'}
                  points={deal.pointsRequired}
                  index={idx}
                  onPress={() => router.push(`/deal/${deal.id}` as any)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
