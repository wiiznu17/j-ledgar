import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ArrowRight, Zap, Gift } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

const MOCK_DEALS = [
  {
    id: '1',
    title: '50% OFF STARBUCKS',
    subtitle: 'Exclusive for J-Ledger Premium',
    image: require('../../../assets/images/deal_starbucks.png'),
    tag: 'LIMITED',
  },
  {
    id: '2',
    title: 'DOUBLE POINTS FRIDAY',
    subtitle: 'Earn 2x rewards on every Scan Pay',
    image: require('../../../assets/images/deal_points.png'),
    tag: 'HOT DEAL',
  },
  {
    id: '3',
    title: 'GRABFOOD ฿100 OFF',
    subtitle: 'Minimum spend of ฿500 via Wallet',
    image: require('../../../assets/images/deal_grabfood.png'),
    tag: 'POPULAR',
  },
];

export default function DealsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      {/* Header ตามแนวทางหน้า History */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-white rounded-2xl items-center justify-center border border-gray-100 shadow-sm"
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-gray-800 font-manrope">Today's Deals</Text>
        <TouchableOpacity className="w-10 h-10 bg-white rounded-2xl items-center justify-center border border-gray-100 shadow-sm">
          <Gift size={20} color="#f48fb1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Points Balance Card - ปรับโทนชมพู */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-sm mb-8 overflow-hidden"
        >
          <View className="flex-row items-center justify-between relative z-10">
            <View className="flex-1">
              <Text className="text-[#f48fb1] font-manrope font-black text-3xl mb-1 tracking-tighter">
                1,250 <Text className="text-sm">pts</Text>
              </Text>
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest">
                Available Balance
              </Text>
            </View>
            <TouchableOpacity className="bg-[#f48fb1] px-6 py-3 rounded-2xl shadow-lg shadow-pink-200">
              <Text className="text-white font-manrope font-black text-[10px] uppercase tracking-widest">
                Redeem
              </Text>
            </TouchableOpacity>
          </View>
        </MotiView>

        <Text className="text-[11px] font-manrope font-black text-[#f48fb1] uppercase tracking-widest mb-6 px-1">
          Exclusive Rewards
        </Text>

        <View className="gap-y-8">
          {MOCK_DEALS.map((deal, idx) => (
            <MotiView
              key={deal.id}
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 100 }}
            >
              <TouchableOpacity className="rounded-[2.5rem] overflow-hidden bg-white border border-gray-50 shadow-sm active:scale-[0.98]">
                <Image
                  source={typeof deal.image === 'string' ? { uri: deal.image } : deal.image}
                  className="w-full h-48"
                />
                <View className="absolute top-5 right-5">
                  <View className="bg-[#f48fb1] px-4 py-2 rounded-xl">
                    <Text className="text-white text-[9px] font-manrope font-black uppercase tracking-widest">
                      {deal.tag}
                    </Text>
                  </View>
                </View>

                <View className="p-8">
                  <Text className="text-xl font-manrope font-black text-gray-800 mb-2 tracking-tight">
                    {deal.title}
                  </Text>
                  <Text className="text-xs font-manrope font-bold text-gray-400 mb-6 leading-relaxed">
                    {deal.subtitle}
                  </Text>

                  <View className="flex-row items-center justify-between pt-6 border-t border-gray-50">
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-xl bg-pink-50 items-center justify-center">
                        <Zap size={18} color="#f48fb1" fill="#f48fb1" />
                      </View>
                      <View>
                        <Text className="text-[9px] font-manrope font-black text-gray-300 uppercase tracking-widest mb-0.5">
                          Price
                        </Text>
                        <Text className="text-xs font-manrope font-black text-[#f48fb1] uppercase">
                          500 Points
                        </Text>
                      </View>
                    </View>
                    <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center border border-gray-100">
                      <ArrowRight size={20} color="#1a1a1a" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
