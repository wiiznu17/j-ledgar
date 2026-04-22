import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DealHeader } from '@/components/deal/DealHeader';
import { MyDealRow } from '@/components/deal/MyDealRow';

const MY_DEALS = [
  {
    id: '1',
    title: '50% OFF STARBUCKS',
    expire: 'Expires in 7 Days',
    image: require('../../../assets/images/deal_starbucks.png'),
    status: 'Ready to use',
  },
];

export default function MyDealsScreen() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleOpenQR = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    // Mock processing / loading QR
    setTimeout(() => {
      setIsProcessing(false);
      // In real app, open QR modal
    }, 1000);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <DealHeader title="My Deals" showBack onBackPress={() => router.back()} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-y-6 mt-4">
          {MY_DEALS.map((deal, idx) => (
            <MyDealRow
              key={deal.id}
              {...deal}
              index={idx}
              onPressQR={handleOpenQR}
              isProcessing={isProcessing}
            />
          ))}
        </View>

        {/* Empty State Mock */}
        {MY_DEALS.length === 0 && (
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 font-manrope font-bold text-sm">
              No active deals right now.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
