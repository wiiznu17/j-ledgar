import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  ShieldCheck,
  CreditCard,
  ChevronLeft,
  ArrowRight,
  X,
  AlertCircle,
  Star,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

const { width } = Dimensions.get('window');

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch notifications from backend
  const { data: notificationsData, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsData?.items || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const getIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('payment') || t.includes('transaction')) return <CreditCard size={22} color="#4855a5" />;
    if (t.includes('security')) return <ShieldCheck size={22} color="#ef4444" />;
    if (t.includes('points')) return <Star size={22} color="#f48fb1" />;
    if (t.includes('kyc')) return <ShieldCheck size={22} color="#4855a5" />;
    if (t.includes('error')) return <AlertCircle size={22} color="#ef4444" />;
    return <Bell size={22} color="#4855a5" />;
  };

  const getIconBg = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('security') || t.includes('error')) return 'bg-red-50';
    if (t.includes('points')) return 'bg-primary/10';
    if (t.includes('payment') || t.includes('transaction')) return 'bg-blue-50';
    return 'bg-[#eff0f7]';
  };

  const formatTime = (dateString: string) => {
    const timestamp = new Date(dateString).getTime();
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

  const handleNotificationPress = (notification: any) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Deep linking logic based on notification metadata
    const metadata = notification.metadata || {};
    const transactionId = metadata.transactionId;
    const type = notification.type;

    if (transactionId && (type === 'TRANSFER' || type === 'TOPUP')) {
      router.push(`/transaction/${transactionId}`);
    } else if (type === 'KYC_STATUS') {
      router.push('/profile/information');
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
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4855a5" />
        }
      >
        {/* Background Decorative Blob */}
        <MotiView
          from={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.1, scale: 1 }}
          className="absolute top-0 right-[-50] w-[200] h-[200] bg-primary rounded-full"
          style={{ filter: [{ blur: 80 }] }}
        />

        {isLoading && !isRefetching ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#4855a5" />
          </View>
        ) : (
          <>
            {/* Unread count */}
            {notifications.length > 0 && (
              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text className="text-sm font-manrope font-bold text-on-surfaceVariant">
                    {unreadCount} unread
                  </Text>
                </View>
              </View>
            )}

            <View className="space-y-4">
              {notifications.map((item: any, idx: number) => (
                <MotiView
                  key={item.id}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: idx * 50 }}
                >
                  <TouchableOpacity
                    onPress={() => handleNotificationPress(item)}
                    className={`border rounded-[30] p-5 flex-row gap-5 shadow-sm active:opacity-70 ${
                      item.isRead
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
                          numberOfLines={1}
                          className={`text-base font-manrope tracking-tight flex-1 mr-2 ${
                            item.isRead ? 'font-bold text-on-surface' : 'font-black text-primary'
                          }`}
                        >
                          {item.title}
                        </Text>
                        <Text className="text-[10px] font-manrope font-black text-on-surfaceVariant/40 uppercase tracking-tighter">
                          {formatTime(item.createdAt)}
                        </Text>
                      </View>
                      <Text className="text-[12px] font-manrope font-medium text-on-surfaceVariant leading-relaxed">
                        {item.message}
                      </Text>
                    </View>
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
