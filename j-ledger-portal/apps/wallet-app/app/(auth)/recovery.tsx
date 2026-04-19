import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldAlert, Mail, Smartphone, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AppTextInput } from '@/src/components/common/AppTextInput';
import { AppButton } from '@/src/components/common/AppButton';
import { GlassPanel } from '@/src/components/common/GlassPanel';

export default function RecoveryScreen() {
  const [phone, setPhone] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-8">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white/60 border border-outline-variant flex items-center justify-center mt-6 mb-10 shadow-sm"
        >
          <ChevronLeft size={24} color="#595b61" />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="items-center mb-10">
            <View className="w-20 h-20 bg-primary/10 rounded-[30] items-center justify-center mb-6">
              <ShieldAlert size={40} color="#f48fb1" />
            </View>
            <Text className="text-3xl font-manrope font-extrabold text-on-surface text-center mb-2">Account Recovery</Text>
            <Text className="text-sm font-manrope font-medium text-on-surfaceVariant text-center">
              Enter your registered details below to reset your PIN or recover your account.
            </Text>
          </View>

          <View className="space-y-6">
            <AppTextInput 
              label="Registered Phone"
              placeholder="08X-XXX-XXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftElement={<Smartphone size={20} color="#595b61" />}
            />
            <AppTextInput 
              label="National ID Number"
              placeholder="X-XXXX-XXXXX-XX-X"
              value={idNumber}
              onChangeText={setIdNumber}
              keyboardType="number-pad"
            />
            
            <View className="pt-4">
               <AppButton 
                title="Send Recovery Code" 
                onPress={() => alert("Recovery code sent to your mobile number.")}
                icon={<ArrowRight size={20} color="white" />}
              />
            </View>

            <TouchableOpacity className="mt-6 items-center">
               <Text className="text-sm font-manrope font-bold text-on-surfaceVariant/60">
                 Need more help? <Text className="text-primary">Contact Support</Text>
               </Text>
            </TouchableOpacity>
          </View>

          <GlassPanel className="mt-12 mb-10" intensity={10}>
            <Text className="text-[10px] font-manrope font-black uppercase tracking-widest text-on-surfaceVariant mb-2 text-center">Security Tip</Text>
            <Text className="text-xs font-manrope font-medium text-on-surfaceVariant leading-relaxed text-center">
              We will never ask for your recovery code or full National ID details over the phone.
            </Text>
          </GlassPanel>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
