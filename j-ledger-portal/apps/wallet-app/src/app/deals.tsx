import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, TicketPercent, Star, ArrowRight, Zap, Gift } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { GlassPanel } from '@/components/common/GlassPanel';

const { width } = Dimensions.get('window');

const MOCK_DEALS = [
  {
    id: '1',
    title: '50% OFF STARBUCKS',
    subtitle: 'Exclusive for J-Ledger Premium',
    image:
      'https://images.unsplash.com/photo-1544787210-2211d44b565a?q=80&w=800&auto=format&fit=crop',
    tag: 'LIMITED',
  },
  {
    id: '2',
    title: 'DOUBLE POINTS FRIDAY',
    subtitle: 'Earn 2x rewards on every Scan Pay',
    image:
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=800&auto=format&fit=crop',
    tag: 'HOT DEAL',
  },
  {
    id: '3',
    title: 'GRABFOOD ฿100 OFF',
    subtitle: 'Minimum spend of ฿500 via Wallet',
    image:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop',
    tag: 'POPULAR',
  },
];

export default function DealsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6fc]">
      <View className="flex-1 px-6">
        <View className="flex-row items-center justify-between mt-6 mb-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 rounded-2xl bg-white/60 border border-outline-variant/10 flex items-center justify-center shadow-sm"
          >
            <ChevronLeft size={24} color="#4855a5" />
          </TouchableOpacity>
          <Text className="text-xl font-manrope font-black text-on-surface tracking-tight">
            Today's Deals
          </Text>
          <TouchableOpacity className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/10 flex items-center justify-center shadow-sm">
            <Gift size={20} color="#f48fb1" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Points Balance Card */}
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
            <GlassPanel
              intensity={40}
              className="p-8 pb-10 flex-row items-center justify-between mb-10 overflow-hidden border-primary/5"
            >
              <View
                className="absolute top-[-30] left-[-30] w-[120] h-[120] bg-primary/5 rounded-full"
                style={{ filter: [{ blur: 40 }] }}
              />

              <View className="flex-1">
                <Text className="text-primary font-manrope font-black text-3xl mb-1 tracking-tighter">
                  1,250 <Text className="text-sm">pts</Text>
                </Text>
                <Text className="text-[10px] font-manrope font-black text-on-surfaceVariant/60 uppercase tracking-[0.2em]">
                  Available Balance
                </Text>
              </View>
              <TouchableOpacity className="bg-primary px-5 py-3 rounded-2xl shadow-xl shadow-primary/20">
                <Text className="text-white font-manrope font-black text-[10px] uppercase tracking-widest">
                  Redeem
                </Text>
              </TouchableOpacity>
            </GlassPanel>
          </MotiView>

          <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-[0.3em] mb-6 px-1">
            Exclusive Rewards
          </Text>

          <View className="space-y-8">
            {MOCK_DEALS.map((deal, idx) => (
              <MotiView
                key={deal.id}
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 100 }}
              >
                <TouchableOpacity className="rounded-[40] overflow-hidden bg-white/40 border border-outline-variant/10 shadow-2xl shadow-black/5 active:scale-[0.98]">
                  <Image source={{ uri: deal.image }} className="w-full h-48" />
                  <View className="absolute top-5 right-5">
                    <View className="bg-secondary/90 px-4 py-2 rounded-xl border border-white/20">
                      <Text className="text-white text-[9px] font-manrope font-black uppercase tracking-widest">
                        {deal.tag}
                      </Text>
                    </View>
                  </View>

                  <View className="p-8">
                    <Text className="text-xl font-manrope font-black text-on-surface mb-2 tracking-tight">
                      {deal.title}
                    </Text>
                    <Text className="text-xs font-manrope font-bold text-on-surfaceVariant/60 mb-6 leading-relaxed">
                      {deal.subtitle}
                    </Text>

                    <View className="flex-row items-center justify-between pt-6 border-t border-outline-variant/10">
                      <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                          <Zap size={18} color="#f48fb1" fill="#f48fb1" />
                        </View>
                        <View>
                          <Text className="text-[9px] font-manrope font-black text-on-surfaceVariant/40 uppercase tracking-widest mb-0.5">
                            Price
                          </Text>
                          <Text className="text-xs font-manrope font-black text-primary uppercase">
                            500 Points
                          </Text>
                        </View>
                      </View>
                      <View className="w-12 h-12 bg-[#eff0f7] rounded-2xl items-center justify-center border border-outline-variant/5">
                        <ArrowRight size={20} color="#4855a5" />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>

          <View className="h-20" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
