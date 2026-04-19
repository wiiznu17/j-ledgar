import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, QrCode } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

// Mock Deals ที่แลกมาแล้ว
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
      {/* Header */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          disabled={isProcessing}
          className={`w-10 h-10 bg-white rounded-2xl items-center justify-center border border-gray-100 shadow-sm ${isProcessing ? 'opacity-50' : ''}`}
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-gray-800 font-manrope">My Deals</Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-y-6 mt-4">
          {MY_DEALS.map((deal, idx) => (
            <MotiView
              key={deal.id}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: idx * 100 }}
              className="bg-white rounded-[2.5rem] p-5 border border-gray-50 shadow-sm flex-row items-center gap-4"
            >
              <Image
                source={typeof deal.image === 'string' ? { uri: deal.image } : deal.image}
                className="w-24 h-24 rounded-3xl"
              />
              <View className="flex-1 py-1">
                <View className="bg-green-50 px-2 py-1 rounded-md self-start mb-2">
                  <Text className="text-[8px] font-manrope font-black text-green-500 uppercase tracking-widest">
                    {deal.status}
                  </Text>
                </View>
                <Text className="text-sm font-manrope font-black text-gray-800 tracking-tight mb-1">
                  {deal.title}
                </Text>
                <Text className="text-[10px] font-manrope font-bold text-gray-400 uppercase tracking-widest">
                  {deal.expire}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleOpenQR}
                disabled={isProcessing}
                className="w-12 h-12 bg-pink-50 rounded-2xl items-center justify-center border border-pink-100 active:scale-95"
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#f48fb1" />
                ) : (
                  <QrCode size={20} color="#f48fb1" />
                )}
              </TouchableOpacity>
            </MotiView>
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
