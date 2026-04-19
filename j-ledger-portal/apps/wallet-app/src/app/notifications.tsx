import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  ShieldCheck,
  CreditCard,
  ChevronLeft,
  Zap,
  Star,
  ArrowRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Header } from '@/components/common/Header';
import { GlassPanel } from '@/components/common/GlassPanel';

const { width } = Dimensions.get('window');

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Payment Received',
    body: 'You have received ฿1,000.00 from Jane S.',
    time: '2 mins ago',
    type: 'payment',
  },
  {
    id: '2',
    title: 'Security Alert',
    body: 'New device login detected from "iPhone 15 Pro".',
    time: '1 hour ago',
    type: 'security',
  },
  {
    id: '3',
    title: 'Reward Points',
    body: 'You earned 50 pts from your transaction at Starbucks.',
    time: 'Yesterday',
    type: 'points',
  },
  {
    id: '4',
    title: 'Maintenance Notice',
    body: 'System maintenance scheduled for tomorrow 2 AM.',
    time: 'Yesterday',
    type: 'info',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard size={22} color="#4855a5" />;
      case 'security':
        return <ShieldCheck size={22} color="#ef4444" />;
      case 'points':
        return <Star size={22} color="#f48fb1" />;
      default:
        return <Bell size={22} color="#4855a5" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'security':
        return 'bg-red-50';
      case 'points':
        return 'bg-primary/10';
      default:
        return 'bg-[#eff0f7]';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6fc]">
      <View className="px-6 mt-6 mb-4 flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white/60 border border-outline-variant/10 flex items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#4855a5" />
        </TouchableOpacity>
        <Text className="text-xl font-manrope font-black text-on-surface tracking-tight">
          Notifications
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Background Decorative Blob */}
        <MotiView
          from={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.1, scale: 1 }}
          className="absolute top-0 right-[-50] w-[200] h-[200] bg-primary rounded-full"
          style={{ filter: [{ blur: 80 }] }}
        />

        <View className="space-y-4">
          {MOCK_NOTIFICATIONS.map((item, idx) => (
            <MotiView
              key={item.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: idx * 100 }}
            >
              <TouchableOpacity className="bg-white/40 border border-outline-variant/5 rounded-[30] p-5 flex-row gap-5 shadow-sm active:opacity-70">
                <View
                  className={`w-14 h-14 rounded-2xl ${getIconBg(item.type)} items-center justify-center border border-outline-variant/5`}
                >
                  {getIcon(item.type)}
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-base font-manrope font-black text-on-surface tracking-tight">
                      {item.title}
                    </Text>
                    <Text className="text-[10px] font-manrope font-black text-on-surfaceVariant/40 uppercase tracking-tighter">
                      {item.time}
                    </Text>
                  </View>
                  <Text className="text-[12px] font-manrope font-medium text-on-surfaceVariant leading-relaxed">
                    {item.body}
                  </Text>
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>

        {MOCK_NOTIFICATIONS.length === 0 && (
          <View className="items-center justify-center py-40">
            <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-6">
              <Bell size={32} color="#4855a540" />
            </View>
            <Text className="font-manrope font-black text-on-surfaceVariant/40 uppercase tracking-widest">
              Quiet Inbox
            </Text>
          </View>
        )}

        <View className="mt-12 items-center">
          <TouchableOpacity className="flex-row items-center gap-2">
            <Text className="text-xs font-manrope font-black text-secondary uppercase tracking-widest">
              Mark all as read
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
