import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Settings,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  LogOut,
  Bell,
  HelpCircle,
  Smartphone,
  Info,
  BadgeCheck,
  Zap,
  ChevronLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Header } from '@/components/common/Header';
import { GlassPanel } from '@/components/common/GlassPanel';
import { useAuthStore } from '@/store/auth';

const { width } = Dimensions.get('window');

const MOCK_USER = {
  name: 'SOMCHAI DEEJA',
  email: 'somchai.d@jledger.com',
  phone: '081-234-5678',
  avatar: require('../../../assets/images/mock_user_avatar.png'),
  kycStatus: 'Verified',
};

export default function ProfileScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const renderMenuItem = (
    icon: any,
    title: string,
    subtitle?: string,
    route?: string,
    color: string = '#4855a5',
  ) => (
    <TouchableOpacity
      onPress={() => route && router.push(route as any)}
      className="flex-row items-center justify-between py-5 border-b border-outline-variant/10 group active:opacity-60"
    >
      <View className="flex-row items-center gap-5">
        <View className="w-12 h-12 rounded-2xl bg-[#eff0f7] items-center justify-center border border-outline-variant/5">
          {React.cloneElement(icon, { size: 22, color })}
        </View>
        <View>
          <Text className="text-base font-manrope font-black text-on-surface">{title}</Text>
          {subtitle && (
            <Text className="text-[10px] font-manrope font-bold text-on-surfaceVariant/60 uppercase tracking-widest mt-1">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <ChevronRight size={18} color="#4855a550" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6fc]">
      <Header title="My Account" showSearch={false} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <GlassPanel
          intensity={40}
          className="mb-12 p-8 relative overflow-hidden shadow-2xl shadow-primary/5"
        >
          <View
            className="absolute top-[-50] right-[-50] w-[180] h-[180] bg-primary/10 rounded-full"
            style={{ filter: [{ blur: 60 }] }}
          />

          <View className="items-center">
            <View className="relative">
              <Image
                source={MOCK_USER.avatar}
                className="w-28 h-28 rounded-[40] border-4 border-white shadow-2xl mb-4"
              />
              <View className="absolute bottom-6 right-0 w-10 h-10 bg-secondary rounded-full items-center justify-center border-4 border-white shadow-lg">
                <ShieldCheck size={18} color="white" />
              </View>
            </View>

            <Text className="text-2xl font-manrope font-black text-on-surface mb-1">
              {MOCK_USER.name}
            </Text>
            <Text className="text-sm font-manrope font-bold text-on-surfaceVariant/60 mb-4">
              {MOCK_USER.email}
            </Text>

            <View className="flex-row gap-3">
              <View className="bg-primary/10 px-4 py-2 rounded-xl flex-row items-center gap-2 border border-primary/10">
                <Zap size={14} color="#f48fb1" fill="#f48fb1" />
                <Text className="text-[10px] font-manrope font-black text-primary uppercase tracking-widest">
                  Premium Member
                </Text>
              </View>
            </View>
          </View>
        </GlassPanel>

        {/* Section 1: Account */}
        <View className="mb-10">
          <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-[0.3em] mb-4 px-1">
            Account & Security
          </Text>
          <GlassPanel intensity={20} className="p-1 px-5 rounded-[35]">
            {renderMenuItem(<User />, 'Personal Details', 'Identity, Address, Status')}
            {renderMenuItem(<ShieldCheck />, 'Login & Security', 'Password, PIN, Biometrics')}
            {renderMenuItem(<CreditCard />, 'Wallet Management', 'Linked Banks, Cards')}
            <View className="border-0">
              {renderMenuItem(<Smartphone />, 'Active Devices', 'Manage Your Sessions')}
            </View>
          </GlassPanel>
        </View>

        {/* Section 2: Preferences */}
        <View className="mb-10">
          <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-[0.3em] mb-4 px-1">
            Preferences
          </Text>
          <GlassPanel intensity={20} className="p-1 px-5 rounded-[35]">
            {renderMenuItem(
              <Bell />,
              'Notification Center',
              'Alert Settings, History',
              '/notifications',
            )}
            <View className="border-0">
              {renderMenuItem(
                <Settings />,
                'App Preferences',
                'Display, Language, Clear Cache',
                '/settings',
              )}
            </View>
          </GlassPanel>
        </View>

        {/* Section 3: Legal */}
        <View className="mb-12">
          <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-[0.3em] mb-4 px-1">
            Support & Legal
          </Text>
          <GlassPanel intensity={20} className="p-1 px-5 rounded-[35]">
            {renderMenuItem(<HelpCircle />, 'Help & Support', 'FAQ, Live Chat, Email')}
            <View className="border-0">
              {renderMenuItem(<Info />, 'About J-Ledger', 'V 4.2.0 (Stable Build 2026)')}
            </View>
          </GlassPanel>
        </View>

        {/* Logout Button */}
        <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <TouchableOpacity
            onPress={() => {
              logout();
              router.replace('/login');
            }}
            className="bg-red-500 h-16 rounded-[25] flex-row items-center justify-center gap-3 mb-12 shadow-xl shadow-red-200"
          >
            <LogOut size={22} color="white" />
            <Text className="text-white font-manrope font-black text-lg uppercase tracking-tight">
              Sign Out
            </Text>
          </TouchableOpacity>
        </MotiView>

        <View className="items-center pb-10">
          <Text className="text-[10px] font-manrope font-black uppercase tracking-[0.6em] text-on-surfaceVariant/20 mr-[-0.6em]">
            J-LEDGER FINANCIAL GROUP
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
