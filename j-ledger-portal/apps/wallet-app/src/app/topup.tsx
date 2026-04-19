import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Landmark,
  CreditCard,
  ArrowRight,
  Wallet,
  CheckCircle2,
  Zap,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { AppTextInput } from '@/components/common/AppTextInput';
import { AppButton } from '@/components/common/AppButton';
import { GlassPanel } from '@/components/common/GlassPanel';

const { width } = Dimensions.get('window');

export default function TopupScreen() {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const router = useRouter();

  const renderMethod = (id: string, icon: any, title: string, subtitle: string) => (
    <TouchableOpacity
      onPress={() => setSelectedMethod(id)}
      className={`flex-row items-center justify-between p-5 rounded-[28] mb-4 border transition-all ${selectedMethod === id ? 'bg-white/80 border-secondary/20 shadow-lg shadow-secondary/5' : 'bg-white/40 border-outline-variant/10'}`}
    >
      <View className="flex-row items-center gap-5">
        <View
          className={`w-14 h-14 rounded-2xl items-center justify-center ${selectedMethod === id ? 'bg-secondary/10' : 'bg-[#eff0f7]'}`}
        >
          {React.cloneElement(icon, {
            size: 24,
            color: selectedMethod === id ? '#f48fb1' : '#4855a5',
          })}
        </View>
        <View>
          <Text className="text-base font-manrope font-black text-on-surface">{title}</Text>
          <Text className="text-[10px] font-manrope font-bold text-on-surfaceVariant/60 uppercase tracking-widest mt-1">
            {subtitle}
          </Text>
        </View>
      </View>
      <View
        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${selectedMethod === id ? 'bg-secondary border-secondary' : 'border-outline-variant/20'}`}
      >
        {selectedMethod === id && <CheckCircle2 size={14} color="white" />}
      </View>
    </TouchableOpacity>
  );

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
            Top Up Wallet
          </Text>
          <TouchableOpacity className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/10 flex items-center justify-center shadow-sm">
            <Zap size={20} color="#f48fb1" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Amount Section */}
          <GlassPanel
            intensity={40}
            className="p-8 mb-10 items-center overflow-hidden border-secondary/5"
          >
            <View
              className="absolute top-[-40] right-[-40] w-[150] h-[150] bg-secondary/5 rounded-full"
              style={{ filter: [{ blur: 40 }] }}
            />

            <Text className="text-[10px] font-manrope font-black text-on-surfaceVariant/60 uppercase tracking-[0.2em] mb-10">
              Select Top Up Amount
            </Text>

            <View className="flex-row items-baseline justify-center mb-10">
              <Text className="text-3xl font-manrope font-black text-secondary mr-3">฿</Text>
              <AppTextInput
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                className="text-5xl font-manrope font-black text-on-surface text-center p-0 border-0 bg-transparent flex-none min-w-[180]"
                containerClassName="border-0 bg-transparent"
              />
            </View>

            <View className="flex-row flex-wrap justify-center gap-4">
              {['100', '500', '1,000', '5,000'].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setAmount(val.replace(',', ''))}
                  className="px-6 py-3 rounded-2xl bg-white/60 border border-outline-variant/10 shadow-sm active:scale-95"
                >
                  <Text className="text-xs font-manrope font-black text-on-surface">{val}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassPanel>

          {/* Methods Section */}
          <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-[0.3em] mb-5 px-1">
            Payment Method
          </Text>

          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }}>
            {renderMethod('bank', <Landmark />, 'Bank Transfer', 'SCB, KBANK, BBL & More')}
            {renderMethod('card', <CreditCard />, 'Debit/Credit Card', 'Visa, Mastercard, JCB')}
            {renderMethod('promptpay', <Wallet />, 'PromptPay QR', 'Instant scan to pay')}
          </MotiView>

          <View className="mt-12 mb-20">
            <AppButton
              title="Confirm Top Up"
              disabled={!amount}
              onPress={() => router.push('/(tabs)' as any)}
              className="h-16 rounded-[25]"
              icon={<ArrowRight size={22} color="white" />}
            />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
