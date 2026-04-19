import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Landmark, User, Smartphone, Info, ArrowRight, Scan, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { AppTextInput } from '@/src/components/common/AppTextInput';
import { AppButton } from '@/src/components/common/AppButton';
import { GlassPanel } from '@/src/components/common/GlassPanel';

const { width } = Dimensions.get('window');

const RECENT_RECIPIENTS = [
  { id: '1', name: 'SOMCHAI D.', phone: '081-XXX-5678', avatar: require('../../assets/images/mock_user_avatar.png') },
  { id: '2', name: 'JANE S.', phone: '089-XXX-1234', avatar: { uri: 'https://randomuser.me/api/portraits/women/44.jpg' } },
  { id: '3', name: 'WICHAI R.', phone: '085-XXX-9988', avatar: { uri: 'https://randomuser.me/api/portraits/men/55.jpg' } },
];

export default function TransferScreen() {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6fc]">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mt-6 mb-10">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-12 h-12 rounded-2xl bg-white/60 border border-outline-variant/10 flex items-center justify-center shadow-sm"
          >
            <ChevronLeft size={24} color="#4855a5" />
          </TouchableOpacity>
          <Text className="text-xl font-manrope font-black text-on-surface tracking-tight">Transfer Money</Text>
          <TouchableOpacity 
            className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/10 flex items-center justify-center shadow-sm"
          >
            <Scan size={20} color="#f48fb1" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Recipient Input */}
          <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-[0.3em] mb-4 px-1">Search Recipient</Text>
          <GlassPanel intensity={20} className="p-1 mb-8">
             <AppTextInput 
               placeholder="Name, Phone or Account Number"
               value={recipient}
               onChangeText={setRecipient}
               containerClassName="border-0 bg-transparent"
               leftElement={<Search size={18} color="#4855a5" />}
             />
          </GlassPanel>

          {/* Recent Recipients */}
          <View className="mb-10">
             <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-[0.3em] mb-5 px-1">Recent Contacts</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-2">
                {RECENT_RECIPIENTS.map(contact => (
                  <TouchableOpacity 
                    key={contact.id}
                    onPress={() => setRecipient(contact.name)}
                    className="items-center mx-3"
                  >
                     <MotiView
                        from={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative"
                     >
                        <Image source={contact.avatar as any} className="w-16 h-16 rounded-[22] border-4 border-white shadow-xl mb-3" />
                        <View className="absolute bottom-4 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                     </MotiView>
                     <Text className="text-[10px] font-manrope font-black text-on-surface uppercase tracking-tighter">{contact.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity className="items-center mx-3">
                   <View className="w-16 h-16 rounded-[22] bg-white/60 border border-dashed border-secondary/20 items-center justify-center mb-3">
                      <User size={24} color="#f48fb1" />
                   </View>
                   <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-tighter">View All</Text>
                </TouchableOpacity>
             </ScrollView>
          </View>

          {/* Amount Card */}
          <GlassPanel intensity={40} className="p-8 mb-10 items-center overflow-hidden border-secondary/5">
             <View className="absolute top-[-40] right-[-40] w-[150] h-[150] bg-secondary/5 rounded-full" style={{ filter: [{ blur: 40 }] }} />
             
             <Text className="text-[10px] font-manrope font-black text-on-surfaceVariant/60 uppercase tracking-[0.2em] mb-10">Total Amount to Send</Text>
             
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
             
             <View className="flex-row gap-4">
                {['100', '500', '1,000'].map(val => (
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

          {/* Note Input */}
          <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-[0.3em] mb-4 px-1">Optional Message</Text>
          <GlassPanel intensity={20} className="p-1 mb-10">
             <AppTextInput 
               placeholder="Add a payment note..."
               value={note}
               onChangeText={setNote}
               containerClassName="border-0 bg-transparent"
               className="font-manrope font-medium"
             />
          </GlassPanel>

          {/* Warning Banner */}
          <View className="bg-primary/5 p-5 rounded-[28] border border-primary/10 flex-row items-center gap-4 mb-12">
             <View className="w-10 h-10 rounded-2xl bg-primary/10 items-center justify-center">
                <Info size={18} color="#f48fb1" />
             </View>
             <Text className="text-[10px] font-manrope font-bold text-on-surfaceVariant leading-[1.6] flex-1">
               Please confirm the recipient's identity before proceeding. Unauthorized transfers cannot be refunded.
             </Text>
          </View>

          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AppButton 
              title="Next Step" 
              disabled={!recipient || !amount}
              onPress={() => router.push('/transfer/success' as any)}
              className="h-16 rounded-[25]"
              icon={<ArrowRight size={22} color="white" />}
            />
          </MotiView>

          <View className="h-20" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
