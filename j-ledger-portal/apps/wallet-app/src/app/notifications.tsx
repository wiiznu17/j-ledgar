import React, { useState } from 'react';
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
  X,
  Gift,
  AlertCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Header } from '@/components/common/Header';
import { GlassPanel } from '@/components/common/GlassPanel';
import { useNotificationStore, Notification } from '@/store/notifications';

const { width } = Dimensions.get('window');

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard size={22} color="#4855a5" />;
      case 'security':
        return <ShieldCheck size={22} color="#ef4444" />;
      case 'points':
        return <Star size={22} color="#f48fb1" />;
      case 'transfer':
        return <ArrowRight size={22} color="#4855a5" />;
      case 'error':
        return <AlertCircle size={22} color="#ef4444" />;
      default:
        return <Bell size={22} color="#4855a5" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'security':
      case 'error':
        return 'bg-red-50';
      case 'points':
        return 'bg-primary/10';
      case 'transfer':
      case 'payment':
        return 'bg-blue-50';
      default:
        return 'bg-[#eff0f7]';
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // Handle notification action based on type
    if (notification.data?.action === 'transfer') {
      router.push('/transfer');
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

        {/* Unread count and Mark all as read */}
        {notifications.length > 0 && (
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-sm font-manrope font-bold text-on-surfaceVariant">
                {notifications.filter((n) => !n.read).length} unread
              </Text>
            </View>
            {notifications.some((n) => !n.read) && (
              <TouchableOpacity
                onPress={markAllAsRead}
                className="px-3 py-1.5 bg-primary/10 rounded-full active:opacity-70"
              >
                <Text className="text-xs font-manrope font-black text-primary uppercase tracking-widest">
                  Mark all as read
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View className="space-y-4">
          {notifications.map((item, idx) => (
            <MotiView
              key={item.id}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: idx * 100 }}
            >
              <TouchableOpacity
                onPress={() => handleNotificationPress(item)}
                className={`border rounded-[30] p-5 flex-row gap-5 shadow-sm active:opacity-70 ${
                  item.read
                    ? 'bg-white/40 border-outline-variant/5'
                    : 'bg-blue-50/40 border-primary/20'
                }`}
              >
                <View
                  className={`w-14 h-14 rounded-2xl ${getIconBg(item.type)} items-center justify-center border border-outline-variant/5`}
                >
                  {getIcon(item.type)}
                </View>
                <View className="flex-1">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text
                      className={`text-base font-manrope tracking-tight ${
                        item.read ? 'font-bold text-on-surface' : 'font-black text-primary'
                      }`}
                    >
                      {item.title}
                    </Text>
                    <Text className="text-[10px] font-manrope font-black text-on-surfaceVariant/40 uppercase tracking-tighter">
                      {formatTime(item.timestamp)}
                    </Text>
                  </View>
                  <Text className="text-[12px] font-manrope font-medium text-on-surfaceVariant leading-relaxed">
                    {item.body}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeNotification(item.id)}
                  className="w-6 h-6 rounded-full items-center justify-center active:bg-black/5"
                >
                  <X size={18} color="#4855a5" />
                </TouchableOpacity>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>

        {notifications.length === 0 && (
          <View className="items-center justify-center py-40">
            <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-6">
              <Bell size={32} color="#4855a540" />
            </View>
            <Text className="font-manrope font-black text-on-surfaceVariant/40 uppercase tracking-widest">
              Quiet Inbox
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
