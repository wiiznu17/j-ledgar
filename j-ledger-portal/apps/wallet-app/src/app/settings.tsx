import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Globe,
  Moon,
  Bell,
  Shield,
  Lock,
  Eye,
  ChevronLeft,
  CircleHelp,
  Fingerprint,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Header } from '@/components/common/Header';
import { GlassPanel } from '@/components/common/GlassPanel';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isBiometric, setIsBiometric] = React.useState(true);
  const router = useRouter();

  const renderSettingItem = (
    icon: any,
    title: string,
    subtitle?: string,
    rightElement?: React.ReactNode,
  ) => (
    <View className="flex-row items-center justify-between py-5 border-b border-outline-variant/10">
      <View className="flex-row items-center gap-5">
        <View className="w-12 h-12 rounded-2xl bg-[#eff0f7] items-center justify-center border border-outline-variant/5">
          {React.cloneElement(icon, { size: 22, color: '#4855a5' })}
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
      {rightElement ? rightElement : <ChevronRight size={18} color="#4855a530" />}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6fc]">
      <View className="px-6 mt-6 mb-6 flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white/60 border border-outline-variant/10 flex items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#4855a5" />
        </TouchableOpacity>
        <Text className="text-xl font-manrope font-black text-on-surface tracking-tight">
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-[0.3em] mb-4 px-1">
          Application
        </Text>
        <GlassPanel intensity={20} className="p-1 px-5 rounded-[35] mb-10">
          {renderSettingItem(<Globe />, 'Language', 'English (United States)')}
          {renderSettingItem(
            <Moon />,
            'Appearance',
            'Standard Light Mode',
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#e2e8f0', true: '#4855a5' }}
              thumbColor={isDarkMode ? '#ffffff' : '#ffffff'}
            />,
          )}
          <View className="border-0">
            {renderSettingItem(<Bell />, 'Alert Sounds', 'System Default')}
          </View>
        </GlassPanel>

        <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-[0.3em] mb-4 px-1">
          Security & Privacy
        </Text>
        <GlassPanel intensity={20} className="p-1 px-5 rounded-[35] mb-10">
          {renderSettingItem(<Lock />, 'Change Secret PIN', 'Update your 6-digit access')}
          {renderSettingItem(
            <Fingerprint />,
            'Biometrics',
            'Face ID & Touch ID',
            <Switch
              value={isBiometric}
              onValueChange={setIsBiometric}
              trackColor={{ false: '#e2e8f0', true: '#4855a5' }}
              thumbColor="#fff"
            />,
          )}
          <View className="border-0">
            {renderSettingItem(<Eye />, 'Privacy Guard', 'Manage Visibility')}
          </View>
        </GlassPanel>

        <Text className="text-[10px] font-manrope font-black text-secondary uppercase tracking-[0.3em] mb-4 px-1">
          Other
        </Text>
        <GlassPanel intensity={20} className="p-1 px-5 rounded-[35] mb-12">
          <View className="border-0">
            {renderSettingItem(<CircleHelp />, 'System Status', 'All systems operational')}
          </View>
        </GlassPanel>

        <View className="items-center py-10">
          <Text className="text-[10px] font-manrope font-black uppercase tracking-[0.6em] text-on-surfaceVariant/20 mr-[-0.6em]">
            VERSION 4.2.0-STABLE
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
