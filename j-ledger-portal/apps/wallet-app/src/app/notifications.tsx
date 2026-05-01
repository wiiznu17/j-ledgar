import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
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
  Newspaper,
  Tag,
  Info,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlatList } from 'react-native';
import { api } from '@/lib/axios';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'ALL', label: 'ทั้งหมด', icon: Bell },
  { id: 'FINANCE', label: 'เงิน', icon: CreditCard },
  { id: 'SYSTEM', label: 'ระบบ', icon: ShieldCheck },
  { id: 'PROMO', label: 'สิทธิพิเศษ', icon: Tag },
  { id: 'NEWS', label: 'ข่าวสาร', icon: Newspaper },
];

const getCategoryForType = (type: string, category?: string) => {
  if (category) return category;
  const t = type?.toUpperCase() || '';
  if (t === 'TRANSFER' || t === 'TOPUP' || t === 'PAYMENT' || t === 'FINANCE') return 'FINANCE';
  if (t === 'SECURITY' || t === 'KYC_STATUS' || t === 'SYSTEM') return 'SYSTEM';
  if (t === 'PROMO' || t === 'OFFER') return 'PROMO';
  if (t === 'NEWS' || t === 'ANNOUNCEMENT') return 'NEWS';
  return 'SYSTEM';
};

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Fetch notifications using Infinite Query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['notifications', selectedCategory],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get('/notifications', {
        params: {
          page: pageParam,
          limit: 15,
          category: selectedCategory,
        },
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
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

  const notifications = data?.pages.flatMap((page) => page.items) || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const getIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('payment') || t.includes('transaction') || t === 'finance') return <CreditCard size={22} color="#4855a5" />;
    if (t.includes('security') || t === 'system') return <ShieldCheck size={22} color="#ef4444" />;
    if (t.includes('points')) return <Star size={22} color="#f48fb1" />;
    if (t.includes('kyc')) return <ShieldCheck size={22} color="#4855a5" />;
    if (t.includes('news') || t.includes('announcement')) return <Newspaper size={22} color="#4855a5" />;
    if (t.includes('promo') || t.includes('offer')) return <Tag size={22} color="#f48fb1" />;
    if (t.includes('error')) return <AlertCircle size={22} color="#ef4444" />;
    return <Bell size={22} color="#4855a5" />;
  };

  const getIconBg = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('security') || t.includes('error') || t === 'system') return 'bg-red-50';
    if (t.includes('points') || t.includes('promo') || t.includes('offer')) return 'bg-primary/10';
    if (t.includes('payment') || t.includes('transaction') || t === 'finance') return 'bg-blue-50';
    if (t.includes('news')) return 'bg-indigo-50';
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
    
    // Deep linking logic
    if (notification.path) {
      router.push(notification.path as any);
      return;
    }

    const metadata = notification.metadata || {};
    const id = notification.referenceId; // Use referenceId which should be the transactionId (UUID)
    const type = notification.type?.toUpperCase();

    console.log('[Notifications] Pressing notification:', {
      id: notification.id,
      type,
      referenceId: id,
      path: notification.path
    });

    if (id && (type === 'TRANSFER' || type === 'TOPUP' || type === 'PAYMENT')) {
      const targetPath = `/transaction/${id}`;
      console.log(`[Notifications] Navigating to: ${targetPath}`);
      router.push(targetPath as any);
    } else if (type === 'KYC_STATUS' || type === 'APPROVED' || type === 'REJECTED') {
      router.push('/profile/information');
    } else if (type === 'SECURITY' || type === 'LOGIN_SUCCESS') {
      router.push('/profile/security' as any);
    }
  };


  const renderNotification = ({ item, index }: { item: any; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 50, type: 'timing', duration: 400 }}
      className="mb-4"
    >
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        className={`border rounded-[30] p-5 flex-row gap-5 shadow-sm active:opacity-70 ${
          item.isRead ? 'bg-white/40 border-outline-variant/5' : 'bg-blue-50/40 border-primary/20'
        }`}
      >
        <View
          className={`w-14 h-14 rounded-2xl ${getIconBg(
            item.type,
          )} items-center justify-center border border-outline-variant/5`}
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
  );

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

      {/* Filter Categories */}
      <View className="mb-6 h-14">
        <FlatList
          horizontal
          data={CATEGORIES}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item: cat }) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(cat.id)}
                className={`flex-row items-center px-5 py-3 rounded-2xl border ${
                  isSelected
                    ? 'bg-primary border-primary shadow-md'
                    : 'bg-white border-outline-variant/10'
                }`}
              >
                <Icon size={18} color={isSelected ? '#fff' : '#4855a5'} />
                <Text
                  className={`ml-2 font-manrope font-bold text-sm ${
                    isSelected ? 'text-white' : 'text-on-surfaceVariant'
                  }`}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {isLoading && !isRefetching ? (
        <View className="py-20 items-center">
          <ActivityIndicator size="large" color="#4855a5" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4855a5" />
          }
          ListHeaderComponent={
            notifications.length > 0 ? (
              <View className="mb-6">
                <Text className="text-sm font-manrope font-bold text-on-surfaceVariant">
                  {unreadCount} unread
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#4855a5" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center justify-center py-40">
                <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-6">
                  <Bell size={32} color="#4855a540" />
                </View>
                <Text className="font-manrope font-black text-on-surfaceVariant/40 uppercase tracking-widest">
                  Quiet Inbox
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Background Decorative Blob */}
      <MotiView
        from={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0.1, scale: 1 }}
        className="absolute top-0 right-[-50] w-[200] h-[200] bg-primary rounded-full"
        pointerEvents="none"
        style={{ filter: [{ blur: 80 }], zIndex: -1 }}
      />
    </SafeAreaView>
  );
}
