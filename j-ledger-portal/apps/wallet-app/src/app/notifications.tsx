import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  ScrollView,
  FlatList,
} from 'react-native';
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
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { NotificationEventType, NotificationCategory } from '@repo/dto';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'ALL', label: 'ทั้งหมด', icon: Bell },
  { id: NotificationCategory.FINANCE, label: 'เงิน', icon: CreditCard },
  { id: NotificationCategory.SYSTEM, label: 'ระบบ', icon: ShieldCheck },
  { id: NotificationCategory.PROMO, label: 'สิทธิพิเศษ', icon: Tag },
  { id: NotificationCategory.NEWS, label: 'ข่าวสาร', icon: Newspaper },
];

const getCategoryForType = (type: string, category?: string) => {
  if (category) return category;
  const t = type?.toUpperCase() || '';
  if (
    t === NotificationEventType.TRANSFER ||
    t === NotificationEventType.TOPUP ||
    t === NotificationEventType.PAYMENT ||
    t === NotificationEventType.FINANCE
  )
    return NotificationCategory.FINANCE;

  if (
    t === NotificationEventType.SECURITY ||
    t === NotificationEventType.KYC_STATUS ||
    t === NotificationEventType.SYSTEM ||
    t === NotificationEventType.KYC_APPROVED ||
    t === NotificationEventType.KYC_REJECTED
  )
    return NotificationCategory.SYSTEM;

  if (t === NotificationEventType.PROMO || t === NotificationEventType.OFFER)
    return NotificationCategory.PROMO;
  if (
    t === NotificationEventType.NEWS ||
    t === NotificationEventType.ANNOUNCEMENT
  )
    return NotificationCategory.NEWS;
  return NotificationCategory.SYSTEM;
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

  // Refetch notifications when screen is focused (e.g. back from transaction detail)
  useFocusEffect(
    useCallback(() => {
      // Only refetch if we already have data to avoid duplicate API requests on mount
      if (data) {
        refetch();
      }
    }, [refetch, data])
  );

  // Mark as read mutation with instant optimistic UI update
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onMutate: async (clickedId: string) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Snapshot the previous queries value
      const previousQueries = queryClient.getQueriesData({ queryKey: ['notifications'] });

      // Optimistically update to read state in all matching queries
      queryClient.setQueriesData<any>({ queryKey: ['notifications'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            items: page.items.map((item: any) =>
              item.id === clickedId ? { ...item, isRead: true } : item
            ),
          })),
        };
      });

      return { previousQueries };
    },
    onError: (err, clickedId, context: any) => {
      // Rollback to previous state on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, value]: any) => {
          queryClient.setQueryData(queryKey, value);
        });
      }
    },
    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.pages.flatMap((page) => page.items) || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const getIcon = (type: string, category?: string) => {
    const cat = getCategoryForType(type, category);

    // Specific overrides if needed
    const t = type?.toUpperCase() || '';
    if (t === NotificationEventType.SECURITY || t.includes('ERROR'))
      return <AlertCircle size={20} color="#ef4444" />;

    if (cat === NotificationCategory.FINANCE)
      return <CreditCard size={20} color="#3b82f6" />;
    if (cat === NotificationCategory.SYSTEM)
      return <ShieldCheck size={20} color="#10b981" />;
    if (cat === NotificationCategory.PROMO)
      return <Tag size={20} color="#f48fb1" />;
    if (cat === NotificationCategory.NEWS)
      return <Newspaper size={20} color="#f59e0b" />;

    return <Bell size={20} color="#64748b" />;
  };

  const getIconBg = (type: string, category?: string) => {
    const cat = getCategoryForType(type, category);
    const t = type?.toUpperCase() || '';
    if (t === NotificationEventType.SECURITY || t.includes('ERROR')) return 'bg-red-50';

    if (cat === NotificationCategory.FINANCE) return 'bg-blue-50';
    if (cat === NotificationCategory.SYSTEM) return 'bg-emerald-50';
    if (cat === NotificationCategory.PROMO) return 'bg-pink-50';
    if (cat === NotificationCategory.NEWS) return 'bg-amber-50';

    return 'bg-gray-50';
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

    // Deep linking logic with client-side mapping for routes not implemented
    let targetPath = notification.path;
    if (targetPath === '/loyalty') {
      targetPath = '/(tabs)/deals'; // Redirect to the actual deals/points tab!
    } else if (targetPath === '/profile/security') {
      targetPath = '/(tabs)/profile'; // Redirect to profile settings!
    }

    if (targetPath) {
      router.push(targetPath as any);
      return;
    }

    const metadata = notification.metadata || {};
    const id = notification.referenceId; // Use referenceId which should be the transactionId (UUID)
    const type = notification.type?.toUpperCase();

    console.log('[Notifications] Pressing notification:', {
      id: notification.id,
      type,
      referenceId: id,
      path: notification.path,
    });

    if (
      id &&
      (type === NotificationEventType.TRANSFER ||
        type === NotificationEventType.TOPUP ||
        type === NotificationEventType.PAYMENT)
    ) {
      const transPath = `/transaction/${id}`;
      console.log(`[Notifications] Navigating to: ${transPath}`);
      router.push(transPath as any);
    } else if (
      type === 'KYC_STATUS' ||
      type === NotificationEventType.KYC_APPROVED ||
      type === NotificationEventType.KYC_REJECTED
    ) {
      router.push('/profile/information');
    } else if (
      type === 'SECURITY' ||
      type === NotificationEventType.LOGIN_SUCCESS
    ) {
      router.push('/(tabs)/profile' as any); // Redirect to profile tab settings where security items are
    }
  };

  // Standard full-screen loading state consistent with other app pages
  if (isLoading && !isRefetching && notifications.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 bg-transparent items-center justify-center"
        edges={['top']}
      >
        <ActivityIndicator size="large" color="#f48fb1" />
        <Text className="text-sm font-manrope font-bold text-gray-400 mt-4">
          กำลังโหลดข้อมูล...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-white rounded-2xl items-center justify-center border border-gray-100 shadow-sm active:scale-95"
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-lg font-black text-gray-800 font-manrope">
          Notifications
        </Text>
        <View className="w-10 h-10" />
      </View>

      {/* Filter Categories */}
      <View className="mb-6">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 1,
            gap: 10,
          }}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <MotiView
                  animate={{
                    backgroundColor: isSelected ? '#f48fb1' : '#ffffff',
                    borderColor: isSelected ? '#f48fb1' : '#f3f4f6',
                  }}
                  className="px-4 py-2.5 rounded-full border shadow-sm flex-row items-center gap-2"
                >
                  <Icon size={14} color={isSelected ? '#ffffff' : '#9ca3af'} />
                  <Text
                    className={`font-manrope font-black text-[11px] uppercase tracking-widest ${
                      isSelected ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </MotiView>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
          data={notifications}
          renderItem={({ item, index }) => (
            <NotificationItem
              item={item}
              index={index}
              onPress={handleNotificationPress}
              getIcon={getIcon}
              getIconBg={getIconBg}
              formatTime={formatTime}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#f48fb1"
            />
          }
          ListHeaderComponent={
            notifications.length > 0 ? (
              <View className="mb-4 px-1">
                <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest">
                  {unreadCount} unread notifications
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#f48fb1" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center justify-center py-20">
                <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                  <Bell size={32} color="#d1d5db" />
                </View>
                <Text className="font-manrope font-black text-gray-400 uppercase tracking-widest text-xs">
                  Quiet Inbox
                </Text>
              </View>
            ) : null
          }
        />
    </SafeAreaView>
  );
}

const NotificationItem = React.memo(
  ({
    item,
    index,
    onPress,
    getIcon,
    getIconBg,
    formatTime,
  }: {
    item: any;
    index: number;
    onPress: (item: any) => void;
    getIcon: (type: string, category?: string) => React.ReactNode;
    getIconBg: (type: string, category?: string) => string;
    formatTime: (date: any) => string;
  }) => (
    <View className="mb-2">
      <TouchableOpacity
        onPress={() => onPress(item)}
        className={`border rounded-[2rem] p-5 flex-row items-center justify-between shadow-sm active:scale-95 ${
          item.isRead
            ? 'bg-white border-gray-50'
            : 'bg-pink-50 border-pink-100 shadow-pink-100/10'
        }`}
      >
        <View className="flex-row items-center gap-4 flex-1">
          {/* Icon Container */}
          <View
            className={`w-12 h-12 rounded-full ${getIconBg(
              item.type,
              item.category,
            )} items-center justify-center border border-outline-variant/5`}
          >
            {getIcon(item.type, item.category)}
          </View>
          <View className="flex-1 mr-2">
            <Text
              numberOfLines={1}
              className={`text-sm font-manrope tracking-tight mb-1 ${
                item.isRead
                  ? 'font-bold text-gray-800'
                  : 'font-black text-pink-400'
              }`}
            >
              {item.title}
            </Text>
            <Text className="text-[12px] font-manrope font-bold text-gray-400 leading-normal">
              {item.message}
            </Text>
          </View>
        </View>
        
        {/* Right side: Time/Date */}
        <View className="items-end justify-center">
          <Text className="text-[9px] font-manrope font-bold text-gray-400 uppercase tracking-widest">
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  ),
);
