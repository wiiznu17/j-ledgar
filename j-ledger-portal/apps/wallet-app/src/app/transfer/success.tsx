import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Share2,
  Download,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { GlassPanel } from '@/components/common/GlassPanel';
import { AppButton } from '@/components/common/AppButton';

const { width } = Dimensions.get('window');

export default function TransferSuccessScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6fc]">
      <View className="flex-1 px-8 items-center justify-center">
        {/* Decorative Background Elements */}
        <View className="absolute inset-0 pointer-events-none">
          <MotiView
            from={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.1, scale: 1 }}
            className="absolute top-[-50] left-[-50] w-[300] h-[300] bg-green-400 rounded-full"
            style={{ filter: [{ blur: 80 }] }}
          />
        </View>

        {/* Animated Check Icon Section */}
        <View className="items-center mb-10">
          <MotiView
            from={{ scale: 0.5, opacity: 0, rotate: '-45deg' }}
            animate={{ scale: 1, opacity: 1, rotate: '0deg' }}
            transition={{ type: 'spring', damping: 10 }}
            className="w-24 h-24 rounded-[35] bg-green-500 items-center justify-center shadow-2xl shadow-green-500/40 mb-8"
          >
            <Check size={48} color="white" strokeWidth={4} />
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
          >
            <Text className="text-3xl font-manrope font-black text-on-surface text-center mb-1 tracking-tight">
              Transfer Sent!
            </Text>
            <Text className="text-sm font-manrope font-bold text-on-surfaceVariant/60 text-center">
              Processing completed successfully.
            </Text>
          </MotiView>
        </View>

        {/* Transaction Details Glass Card */}
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 400 }}
          className="w-full"
        >
          <GlassPanel
            intensity={30}
            className="w-full p-8 mb-10 border-white/40 shadow-2xl shadow-green-900/5"
          >
            <View className="items-center mb-8 pb-8 border-b border-outline-variant/10">
              <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-[0.3em] mb-4">
                Amount Sent
              </Text>
              <Text className="text-5xl font-manrope font-black text-on-surface tracking-tighter">
                <Text className="text-2xl text-secondary">฿</Text>1,000.00
              </Text>
            </View>

            <View className="space-y-5">
              <View className="flex-row justify-between items-center">
                <Text className="text-[10px] font-manrope font-black text-on-surfaceVariant/40 uppercase tracking-widest">
                  Recipient
                </Text>
                <Text className="text-sm font-manrope font-black text-on-surface">
                  SOMCHAI DEEJA
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-[10px] font-manrope font-black text-on-surfaceVariant/40 uppercase tracking-widest">
                  Ref. Code
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-manrope font-black text-on-surface">
                    TXN-88220015
                  </Text>
                  <ShieldCheck size={12} color="#16a34a" />
                </View>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-[10px] font-manrope font-black text-on-surfaceVariant/40 uppercase tracking-widest">
                  Status
                </Text>
                <View className="bg-green-100 px-3 py-1 rounded-lg">
                  <Text className="text-[10px] font-manrope font-black text-green-700 uppercase">
                    Settled
                  </Text>
                </View>
              </View>
            </View>
          </GlassPanel>
        </MotiView>

        {/* Action Buttons */}
        <View className="flex-row gap-5 w-full mb-8">
          <TouchableOpacity className="flex-1 h-16 rounded-[24] bg-white/60 border border-outline-variant/10 items-center justify-center flex-row gap-3 shadow-sm active:scale-95">
            <Share2 size={20} color="#4855a5" />
            <Text className="text-xs font-manrope font-black text-[#4855a5] uppercase tracking-tight">
              Share
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 h-16 rounded-[24] bg-white/60 border border-outline-variant/10 items-center justify-center flex-row gap-3 shadow-sm active:scale-95">
            <Download size={20} color="#4855a5" />
            <Text className="text-xs font-manrope font-black text-[#4855a5] uppercase tracking-tight">
              E-Slip
            </Text>
          </TouchableOpacity>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 600 }}
          className="w-full"
        >
          <AppButton
            title="Back to Desktop"
            onPress={() => router.replace('/(tabs)')}
            className="h-16 rounded-[25]"
          />
        </MotiView>

        <View className="py-10">
          <Text className="text-[10px] font-manrope font-black uppercase tracking-[0.4em] text-on-surfaceVariant/20">
            Digital Receipt Verified
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
