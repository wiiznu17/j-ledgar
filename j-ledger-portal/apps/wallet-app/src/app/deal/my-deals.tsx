import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { DealHeader } from '@/components/deal/DealHeader';
import { MyDealRow } from '@/components/deal/MyDealRow';

export default function MyDealsScreen() {
  const router = useRouter();

  const {
    data: redemptions,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['my-redemptions'],
    queryFn: async () => {
      const { data } = await api.get('/deals/my-redemptions');
      return data;
    },
  });

  const getStatusText = (status: string) => {
    switch (status) {
      case 'REDEEMED':
        return 'Ready to use';
      case 'USED':
        return 'Used';
      case 'EXPIRED':
        return 'Expired';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <DealHeader title="My Deals" showBack onBackPress={() => router.back()} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color="#f48fb1" className="mt-20" />
        ) : isError ? (
          <Text className="text-center text-gray-400 font-manrope font-bold mt-20">
            Failed to load your deals
          </Text>
        ) : redemptions?.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 font-manrope font-bold text-sm">
              No active deals right now.
            </Text>
          </View>
        ) : (
          <View className="gap-y-6 mt-4">
            {redemptions.map((redemption: any, idx: number) => (
              <MyDealRow
                key={redemption.id}
                id={redemption.id}
                title={redemption.deal?.title}
                expire={
                  redemption.status === 'USED'
                    ? `Used on ${new Date(redemption.usedAt).toLocaleDateString()}`
                    : `Expires: ${new Date(redemption.expiresAt).toLocaleDateString()}`
                }
                image={redemption.deal?.imageUrl}
                status={getStatusText(redemption.status)}
                index={idx}
                onPressQR={() => router.push(`/deal/redemption/${redemption.id}` as any)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
