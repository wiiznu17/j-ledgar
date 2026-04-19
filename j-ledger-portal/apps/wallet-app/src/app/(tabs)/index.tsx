import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeftRight,
  PlusCircle,
  ReceiptText,
  ShoppingBag,
  Landmark,
  QrCode,
  Smartphone,
  Gamepad2,
  CreditCard,
  Car,
  ShieldCheck,
  TicketPercent,
  ChevronRight,
  Star,
  LayoutGrid,
  Search,
  Bell,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Header } from '@/components/common/Header';
import { GlassPanel } from '@/components/common/GlassPanel';
import { LinearTransition } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Mock Data matching Reference
const MOCK_USER = {
  name: 'Alex Johnson',
  balance: 45000.0,
  currency: '฿',
  points: 1250,
  avatar: require('../../../assets/images/mock_user_avatar.png'),
  kycStatus: 'PENDING',
};

const RECENT_TRANSACTIONS = [
  {
    id: '1',
    title: 'Gourmet Groceries',
    category: 'Shopping',
    amount: 1240,
    type: 'expense',
    time: '10:24 AM',
  },
  {
    id: '2',
    title: 'Salary Deposit',
    category: 'Deposit',
    amount: 45000,
    type: 'income',
    time: 'Yesterday',
  },
];

export default function HomeScreen() {
  const router = useRouter();

  const renderServiceItem = (
    icon: any,
    label: string,
    color: string,
    route?: string,
    comingSoon?: boolean,
  ) => (
    <TouchableOpacity
      onPress={() => !comingSoon && route && router.push(route as any)}
      className={`items-center w-1/4 mb-8 ${comingSoon ? 'opacity-50' : ''}`}
      activeOpacity={comingSoon ? 1 : 0.7}
    >
      <MotiView
        from={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-14 h-14 rounded-2xl glass-panel items-center justify-center shadow-sm mb-2 relative"
      >
        {React.cloneElement(icon, { size: 24, color: color })}
        {comingSoon && (
          <View className="absolute -top-1 -right-1 bg-on-surfaceVariant px-1 py-0.5 rounded shadow-sm">
            <Text className="text-[6px] font-black text-white uppercase tracking-tighter">
              Soon
            </Text>
          </View>
        )}
      </MotiView>
      <Text className="text-[10px] font-manrope font-bold text-on-surfaceVariant text-center tracking-tight">
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6fc]">
      <Header />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <MotiView
          from={{ opacity: 0, translateX: -10 }}
          animate={{ opacity: 1, translateX: 0 }}
          className="flex-row items-center justify-between mb-8 px-2"
        >
          <View className="flex-row items-center gap-3">
            <Image
              source={MOCK_USER.avatar}
              className="w-12 h-12 rounded-full border-2 border-primary"
            />
            <View>
              <Text className="text-xs font-manrope font-medium text-on-surfaceVariant">
                Hello,
              </Text>
              <Text className="text-base font-manrope font-black text-on-surface">
                {MOCK_USER.name}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Dashboard Section */}
        <View className="space-y-4 mb-8">
          {/* Wallet Card */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="relative rounded-[2rem] glass-card overflow-hidden p-6 shadow-xl shadow-primary/10"
          >
            {/* Background Glow - Exact parity with reference proportions */}
            <View className="absolute -top-10 -right-10 w-44 h-44 bg-primary/10 rounded-full" />

            <View className="space-y-6">
              <View className="flex-row justify-between items-center px-2">
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-primary" />
                  <Text className="text-[10px] font-manrope font-black uppercase tracking-[0.2em] text-on-surfaceVariant opacity-60">
                    Active Balance
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/history' as any)}
                  className="flex-row items-center gap-1"
                >
                  <Text className="text-[10px] font-manrope font-black text-primary uppercase">
                    History
                  </Text>
                  <ChevronRight size={12} color="#f48fb1" />
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-between items-end gap-2 px-2">
                <View className="flex-1 flex-row items-baseline">
                  {/* ใช้ items-baseline เพื่อให้ตัวเลขและสกุลเงินวางอยู่บนเส้นฐานเดียวกัน */}
                  <Text className="text-2xl font-manrope font-black text-on-surface">฿</Text>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    className="text-4xl font-manrope font-black text-on-surface tracking-tighter"
                  >
                    45,000
                  </Text>
                  <Text className="text-xl font-manrope font-black text-on-surfaceVariant">
                    .00
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => router.push('/transfer' as any)}
                  style={{ flexShrink: 0 }} // ป้องกันไม่ให้ปุ่มโดนเบียดหรือไปเบียดคนอื่นจนเพี้ยน
                  className="bg-primary px-5 py-2.5 rounded-xl flex-row items-center gap-2 shadow-lg shadow-primary/30 active:scale-95"
                >
                  <ArrowLeftRight size={14} color="white" strokeWidth={3} />
                  <Text className="text-white font-manrope font-bold text-xs">Transfer</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-3 pt-2">
                <TouchableOpacity
                  onPress={() => router.push('/topup' as any)}
                  className="flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-white/40 border border-white/20 shadow-sm shadow-black/5"
                >
                  <PlusCircle size={18} color="#f48fb1" />
                  <Text className="text-on-surface font-manrope font-bold text-xs">Top up</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/my-qr' as any)}
                  className="flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-white/40 border border-white/20 shadow-sm shadow-black/5"
                >
                  <QrCode size={18} color="#f48fb1" />
                  <Text className="text-on-surface font-manrope font-bold text-xs">My QR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </MotiView>

          {/* Points Card */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 100 }}
            className="glass-card rounded-[1.8rem] p-5 flex-row items-center justify-between border-l-4 border-l-primary/60 shadow-xl shadow-black/5"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                <Star size={24} color="#f48fb1" fill="#f48fb130" />
              </View>
              <View>
                <Text className="text-[10px] font-manrope font-black uppercase tracking-[0.2em] text-on-surfaceVariant opacity-40">
                  Reward Points
                </Text>
                <Text className="text-xl font-manrope font-black text-on-surface">
                  1,250 <Text className="text-sm text-on-surfaceVariant">pts</Text>
                </Text>
              </View>
            </View>
            <TouchableOpacity className="bg-surface-container-low px-4 py-2 rounded-lg items-center justify-center">
              <Text className="text-[10px] font-manrope font-black text-primary uppercase tracking-widest">
                Redeem
              </Text>
            </TouchableOpacity>
          </MotiView>
        </View>

        {/* Services Section */}
        <View className="bg-white/30 rounded-[2rem] p-6 border border-white/20 mb-8">
          <View className="flex-row flex-wrap -mx-2">
            {renderServiceItem(<Smartphone />, 'Top-up', '#3b82f6', '/topup')}
            {renderServiceItem(<ReceiptText />, 'Bills', '#f97316', undefined, true)}
            {renderServiceItem(<Gamepad2 />, 'Games', '#a855f7', undefined, true)}
            {renderServiceItem(<ShieldCheck />, 'Insurance', '#22c55e', undefined, true)}
            {renderServiceItem(<CreditCard />, 'K-Debit', '#14b8a6', undefined, true)}
            {renderServiceItem(<Car />, 'Transport', '#2563eb', undefined, true)}
            {renderServiceItem(<TicketPercent />, 'Deals', '#ec4899', '/deals')}
            {renderServiceItem(<PlusCircle />, 'Others', '#64748b', undefined, true)}
          </View>
        </View>

        {/* Promotional Banners */}
        <View className="mb-10">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
            <TouchableOpacity className="w-[300] aspect-[21/9] rounded-[1.8rem] overflow-hidden mr-4 shadow-xl shadow-black/5 relative group">
              <Image
                source={{ uri: 'https://picsum.photos/seed/promo1/600/300' }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/40 p-5 justify-center">
                <View className="bg-primary self-start px-2 py-0.5 rounded mb-2">
                  <Text className="text-white text-[8px] font-black tracking-widest uppercase">
                    Hot Deals
                  </Text>
                </View>
                <Text className="text-white font-manrope font-black text-lg leading-tight">
                  Get ฿50 Cashback
                </Text>
                <Text className="text-white font-manrope font-medium text-xs">
                  on your first Bill Pay
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="w-[300] aspect-[21/9] rounded-[1.8rem] overflow-hidden mr-10 shadow-xl shadow-black/5 relative">
              <Image
                source={{ uri: 'https://picsum.photos/seed/promo2/600/300' }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/40 p-5 justify-center">
                <View className="bg-secondary self-start px-2 py-0.5 rounded mb-2">
                  <Text className="text-white text-[8px] font-black tracking-widest uppercase">
                    New
                  </Text>
                </View>
                <Text className="text-white font-manrope font-black text-lg leading-tight">
                  Double Points
                </Text>
                <Text className="text-white font-manrope font-medium text-xs">
                  every Friday with Scan & Pay
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View className="space-y-4">
          <View className="flex-row justify-between items-end px-2">
            <Text className="text-lg font-manrope font-black text-on-surface">Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history' as any)}>
              <Text className="text-xs font-manrope font-bold text-primary">See All</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-2">
            {RECENT_TRANSACTIONS.map((tx) => (
              <TouchableOpacity
                key={tx.id}
                className="glass-card rounded-[1.5rem] p-4 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-full bg-surface-container flex-row items-center justify-center">
                    {tx.category === 'Shopping' ? (
                      <ShoppingBag size={22} color="#f48fb1" />
                    ) : (
                      <Landmark size={22} color="#f48fb1" />
                    )}
                  </View>
                  <View>
                    <Text className="font-manrope font-black text-on-surface text-sm">
                      {tx.title}
                    </Text>
                    <Text className="font-manrope text-[10px] font-extrabold text-on-surfaceVariant mt-0.5 uppercase tracking-widest">
                      {tx.category}
                    </Text>
                  </View>
                </View>
                <Text
                  className={`font-manrope font-black text-base ${tx.type === 'income' ? 'text-green-600' : 'text-on-surface'}`}
                >
                  {tx.type === 'expense' ? '-' : '+'}
                  {MOCK_USER.currency}
                  {tx.amount.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
