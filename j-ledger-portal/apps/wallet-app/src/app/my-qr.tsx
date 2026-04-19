import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Share2, Download, Copy, Info, Zap, Scan } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { GlassPanel } from '@/components/common/GlassPanel';
import { AppButton } from '@/components/common/AppButton';

const { width } = Dimensions.get('window');

const MOCK_USER = {
  name: 'SOMCHAI DEEJA',
  walletId: 'JLED-9922-0051',
  avatar: require('../../assets/images/mock_user_avatar.png'),
};

export default function MyQrScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6fc]">
      <View className="flex-1 px-6 items-center">
        {/* Header */}
        <View className="flex-row items-center justify-between w-full mt-6 mb-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 rounded-2xl bg-white/60 border border-outline-variant/10 flex items-center justify-center shadow-sm"
          >
            <ChevronLeft size={24} color="#4855a5" />
          </TouchableOpacity>
          <Text className="text-xl font-manrope font-black text-on-surface tracking-tight">
            Receive Assets
          </Text>
          <TouchableOpacity className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/10 flex items-center justify-center shadow-sm">
            <Scan size={20} color="#f48fb1" />
          </TouchableOpacity>
        </View>

        {/* QR Card */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full"
        >
          <GlassPanel
            intensity={40}
            className="w-full p-10 items-center mb-10 border-white/40 shadow-2xl shadow-primary/5"
          >
            <View className="relative mb-6">
              <Image
                source={MOCK_USER.avatar}
                className="w-20 h-20 rounded-[28] border-4 border-white shadow-xl"
              />
              <View className="absolute bottom-[-4] right-[-4] w-8 h-8 bg-green-500 rounded-full border-4 border-white items-center justify-center">
                <View className="w-2 h-2 bg-white rounded-full" />
              </View>
            </View>

            <Text className="text-2xl font-manrope font-black text-on-surface mb-1 tracking-tight">
              {MOCK_USER.name}
            </Text>
            <View className="flex-row items-center gap-2 mb-10">
              <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-[0.2em]">
                {MOCK_USER.walletId}
              </Text>
              <TouchableOpacity className="bg-secondary/10 px-2 py-1 rounded-lg">
                <Copy size={12} color="#f48fb1" />
              </TouchableOpacity>
            </View>

            {/* QR Code Container */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 300 }}
              className="w-72 h-72 bg-white rounded-[45] items-center justify-center p-8 shadow-2xl shadow-black/5 border border-outline-variant/5"
            >
              <View className="w-full h-full bg-[#f8f9ff] rounded-[35] items-center justify-center border border-primary/5">
                <Image
                  source={{
                    uri: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=JLED-9922-0051&color=4855a5',
                  }}
                  className="w-full h-full opacity-90"
                />
              </View>
              <View className="absolute bg-white p-3 rounded-[22] border border-outline-variant/10 shadow-xl">
                <View className="w-10 h-10 rounded-2xl bg-[#4855a5] items-center justify-center">
                  <Zap size={22} color="white" fill="white" />
                </View>
              </View>
            </MotiView>
          </GlassPanel>
        </MotiView>

        {/* Action Buttons */}
        <View className="flex-row gap-5 w-full mb-12">
          <TouchableOpacity className="flex-1 h-16 rounded-[25] bg-white/60 border border-outline-variant/10 items-center justify-center flex-row gap-3 shadow-sm active:scale-95">
            <Share2 size={20} color="#4855a5" />
            <Text className="text-xs font-manrope font-black text-[#4855a5] uppercase tracking-tight">
              Share QR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 h-16 rounded-[25] bg-white/60 border border-outline-variant/10 items-center justify-center flex-row gap-3 shadow-sm active:scale-95">
            <Download size={20} color="#4855a5" />
            <Text className="text-xs font-manrope font-black text-[#4855a5] uppercase tracking-tight">
              Save Image
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <GlassPanel intensity={10} className="p-5 flex-row items-center gap-5 border-primary/5">
          <View className="w-10 h-10 bg-primary/10 rounded-2xl items-center justify-center">
            <Info size={20} color="#f48fb1" />
          </View>
          <Text className="text-[10px] font-manrope font-bold text-on-surfaceVariant leading-[1.6] flex-1">
            Your unique J-Ledger ID allows instant peer-to-peer asset transfers with zero network
            fees.
          </Text>
        </GlassPanel>
      </View>
    </SafeAreaView>
  );
}
