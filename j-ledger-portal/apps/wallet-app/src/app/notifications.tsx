import React, { useState } from 'react';
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

  const getIcon = (type: string, category?: string) => {
    const cat = getCategoryForType(type, category);

    if (cat === NotificationCategory.FINANCE)
      return <CreditCard size={22} color="#4855a5" />;
    if (cat === NotificationCategory.SYSTEM)
      return <ShieldCheck size={22} color="#4855a5" />;
    if (cat === NotificationCategory.PROMO)
      return <Tag size={22} color="#f48fb1" />;
    if (cat === NotificationCategory.NEWS)
      return <Newspaper size={22} color="#4855a5" />;

    // Specific overrides if needed
    const t = type?.toUpperCase() || '';
    if (t === NotificationEventType.SECURITY || t.includes('ERROR'))
      return <AlertCircle size={22} color="#ef4444" />;

    return <Bell size={22} color="#4855a5" />;
  };

  const getIconBg = (type: string, category?: string) => {
    const cat = getCategoryForType(type, category);

    if (cat === NotificationCategory.FINANCE) return 'bg-blue-50';
    if (cat === NotificationCategory.SYSTEM) return 'bg-red-50';
    if (cat === NotificationCategory.PROMO) return 'bg-primary/10';
    if (cat === NotificationCategory.NEWS) return 'bg-indigo-50';

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
      path: notification.path,
    });

    if (
      id &&
      (type === NotificationEventType.TRANSFER ||
        type === NotificationEventType.TOPUP ||
        type === NotificationEventType.PAYMENT)
    ) {
      const targetPath = `/transaction/${id}`;
      console.log(`[Notifications] Navigating to: ${targetPath}`);
      router.push(targetPath as any);
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
      router.push('/profile/security' as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent">
      <View className="px-6 mt-6 mb-4 flex-row items-center gap-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-md active:scale-95"
        >
          <ChevronLeft size={24} color="#4855a5" />
        </TouchableOpacity>
        <Text className="text-xl font-manrope font-black text-on-surface tracking-tight">
          Notifications
        </Text>
      </View>

      {/* Filter Categories */}
      <View className="mb-6 h-16" style={{ zIndex: 20 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 24,
            gap: 12,
            paddingBottom: 8,
          }}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    borderRadius: 16,
                    borderWidth: 1,
                    backgroundColor: isSelected ? '#4855a5' : '#ffffff',
                    borderColor: isSelected
                      ? '#4855a5'
                      : 'rgba(72, 85, 165, 0.1)',
                    // Manual shadow-md implementation
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isSelected ? 0.15 : 0.05,
                    shadowRadius: 6,
                    elevation: isSelected ? 5 : 1,
                  }}
                >
                  <Icon size={18} color={isSelected ? '#ffffff' : '#4855a5'} />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontFamily: 'Manrope_700Bold',
                      fontSize: 14,
                      color: isSelected ? '#ffffff' : '#4855a5',
                    }}
                  >
                    {cat.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && !isRefetching ? (
        <View className="py-20 items-center">
          <ActivityIndicator size="large" color="#4855a5" />
        </View>
      ) : (
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
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
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
              tintColor="#4855a5"
            />
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
    <View className="mb-4">
      <TouchableOpacity
        onPress={() => onPress(item)}
        className={`border rounded-[30] p-5 flex-row gap-5 shadow-md active:opacity-70 ${
          item.isRead
            ? 'bg-white border-gray-100'
            : 'bg-blue-50 border-blue-100 shadow-blue-100'
        }`}
      >
        <View
          className={`w-14 h-14 rounded-2xl ${getIconBg(
            item.type,
            item.category,
          )} items-center justify-center border border-outline-variant/5`}
        >
          {getIcon(item.type, item.category)}
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1">
            <Text
              numberOfLines={1}
              className={`text-base font-manrope tracking-tight flex-1 mr-2 ${
                item.isRead
                  ? 'font-bold text-on-surface'
                  : 'font-black text-primary'
              }`}
            >
              {item.title}
            </Text>
            <Text className="text-[10px] font-manrope font-black text-gray-500 uppercase tracking-tighter">
              {formatTime(item.createdAt)}
            </Text>
          </View>
          <Text className="text-[12px] font-manrope font-bold text-gray-600 leading-relaxed">
            {item.message}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  ),
);
