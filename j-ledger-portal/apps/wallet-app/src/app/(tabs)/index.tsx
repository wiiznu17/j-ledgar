import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  TextInput,
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
  Search,
  Bell,
  LayoutGrid,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

// Mock Data
const MOCK_USER = {
  name: 'Alex Johnson',
  balance: 45000.0,
  currency: '฿',
  points: 1250,
  avatar: require('../../../assets/images/mock_user_avatar.png'), // ยืนยัน path รูปให้ตรงกับโปรเจกต์
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
      className={`items-center w-1/4 mb-6 ${comingSoon ? 'opacity-50' : ''}`}
      activeOpacity={comingSoon ? 1 : 0.7}
    >
      <MotiView
        from={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-14 h-14 rounded-[1.2rem] bg-white items-center justify-center shadow-sm border border-gray-50 mb-2 relative"
      >
        {React.cloneElement(icon, { size: 24, color: color })}
        {comingSoon && (
          <View className="absolute -top-1.5 -right-1.5 bg-gray-400 px-1.5 py-0.5 rounded-md shadow-sm">
            <Text className="text-[7px] font-black text-white uppercase tracking-widest">Soon</Text>
          </View>
        )}
      </MotiView>
      <Text className="text-[11px] font-manrope font-bold text-gray-500 text-center tracking-tight">
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      {/* Header Section */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <View className="w-10 h-10 bg-[#f48fb1] rounded-2xl items-center justify-center mr-3 shadow-sm shadow-pink-200">
          <Text className="text-white font-black text-xl">W</Text>
        </View>
        <View className="flex-1 mr-4">
          <View className="bg-white border border-gray-100 rounded-full px-4 py-3 flex-row items-center shadow-sm">
            <Search size={16} color="#9ca3af" />
            <Text className="text-gray-400 ml-2 text-xs font-manrope font-bold">Search</Text>
          </View>
        </View>
        <TouchableOpacity className="relative">
          <Bell size={24} color="#1a1a1a" />
          <View className="absolute -top-1 -right-1 bg-red-500 w-4 h-4 rounded-full items-center justify-center border-2 border-[#f8f9fe]">
            <Text className="text-[8px] text-white font-black">13</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <MotiView
          from={{ opacity: 0, translateX: -10 }}
          animate={{ opacity: 1, translateX: 0 }}
          className="flex-row items-center justify-between mb-8"
        >
          <View className="flex-row items-center gap-3">
            <Image
              source={MOCK_USER.avatar}
              className="w-12 h-12 rounded-full border-2 border-[#f48fb1]"
            />
            <View>
              <Text className="text-xs font-manrope font-bold text-gray-400">Hello,</Text>
              <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
                {MOCK_USER.name}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Dashboard Section */}
        <View className="gap-y-4 mb-4">
          {/* Wallet Card */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="relative rounded-[2rem] bg-white overflow-hidden p-6 shadow-xl shadow-pink-100 border border-gray-50"
          >
            {/* Background Glow */}
            <View className="absolute -top-12 -right-12 w-48 h-48 bg-pink-50 rounded-full opacity-80" />

            <View className="space-y-6">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-[#f48fb1]" />
                  <Text className="text-[10px] font-manrope font-black uppercase tracking-[0.2em] text-gray-400">
                    Active Balance
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/history' as any)}
                  className="flex-row items-center gap-1 bg-pink-50 px-3 py-1.5 rounded-full"
                >
                  <Text className="text-[10px] font-manrope font-black text-[#f48fb1] uppercase tracking-wide">
                    History
                  </Text>
                  <ChevronRight size={12} color="#f48fb1" />
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-between items-end gap-2">
                <View className="flex-1 flex-row items-baseline">
                  <Text className="text-2xl font-manrope font-black text-gray-800 mr-1">฿</Text>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.6}
                    className="text-5xl font-manrope font-black text-gray-800 tracking-tighter"
                  >
                    45,000
                  </Text>
                  <Text className="text-xl font-manrope font-black text-gray-400">.00</Text>
                </View>

                <TouchableOpacity
                  onPress={() => router.push('/transfer' as any)}
                  style={{ flexShrink: 0 }}
                  className="bg-[#f48fb1] px-5 py-3 rounded-2xl flex-row items-center gap-2 shadow-lg shadow-pink-200 active:scale-95"
                >
                  <ArrowLeftRight size={16} color="white" strokeWidth={3} />
                  <Text className="text-white font-manrope font-bold text-sm">Transfer</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-3 pt-2">
                <TouchableOpacity
                  onPress={() => router.push('/topup' as any)}
                  className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-50 border border-gray-100"
                >
                  <PlusCircle size={18} color="#f48fb1" />
                  <Text className="text-gray-700 font-manrope font-bold text-xs">Top up</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/my-qr' as any)}
                  className="flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-50 border border-gray-100"
                >
                  <QrCode size={18} color="#f48fb1" />
                  <Text className="text-gray-700 font-manrope font-bold text-xs">My QR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </MotiView>

          {/* Points Card */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 100 }}
            className="bg-white rounded-[1.8rem] p-5 flex-row items-center justify-between border border-gray-50 shadow-sm"
          >
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 rounded-full bg-pink-50 items-center justify-center">
                <Star size={24} color="#f48fb1" fill="#f48fb140" />
              </View>
              <View>
                <Text className="text-[10px] font-manrope font-black uppercase tracking-[0.2em] text-gray-400">
                  Reward Points
                </Text>
                <Text className="text-xl font-manrope font-black text-gray-800 mt-0.5">
                  1,250 <Text className="text-sm font-bold text-gray-400">pts</Text>
                </Text>
              </View>
            </View>
            <TouchableOpacity className="bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
              <Text className="text-[10px] font-manrope font-black text-[#f48fb1] uppercase tracking-widest">
                Redeem
              </Text>
            </TouchableOpacity>
          </MotiView>
        </View>

        {/* Services Section */}
        <View className="bg-white rounded-[2rem] p-6 border border-gray-50 shadow-sm mb-8">
          <View className="flex-row flex-wrap -mx-2 justify-between">
            {renderServiceItem(<Smartphone />, 'Top-up', '#3b82f6', '/topup')}
            {renderServiceItem(<ReceiptText />, 'Bills', '#f97316', undefined, true)}
            {renderServiceItem(<Gamepad2 />, 'Games', '#a855f7', undefined, true)}
            {renderServiceItem(<ShieldCheck />, 'Insurance', '#22c55e', undefined, true)}
            {renderServiceItem(<CreditCard />, 'K-Debit', '#14b8a6', undefined, true)}
            {renderServiceItem(<Car />, 'Transport', '#2563eb', undefined, true)}
            {renderServiceItem(<TicketPercent />, 'Deals', '#ec4899', '/deals')}
            {renderServiceItem(<LayoutGrid />, 'Others', '#64748b', undefined, true)}
          </View>
        </View>

        {/* Promotional Banners */}
        <View className="mb-8">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
            <TouchableOpacity className="w-[300] aspect-[21/9] rounded-[2rem] overflow-hidden mr-4 shadow-sm relative">
              <Image
                source={{ uri: 'https://picsum.photos/seed/promo1/600/300' }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/30 p-5 justify-center">
                <View className="bg-[#f48fb1] self-start px-2 py-0.5 rounded mb-2">
                  <Text className="text-white text-[8px] font-black tracking-widest uppercase">
                    Hot Deals
                  </Text>
                </View>
                <Text className="text-white font-manrope font-black text-xl leading-tight">
                  Get ฿50 Cashback
                </Text>
                <Text className="text-white/90 font-manrope font-bold text-xs mt-1">
                  on your first Bill Pay
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity className="w-[300] aspect-[21/9] rounded-[2rem] overflow-hidden mr-10 shadow-sm relative">
              <Image
                source={{ uri: 'https://picsum.photos/seed/promo2/600/300' }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/30 p-5 justify-center">
                <View className="bg-blue-500 self-start px-2 py-0.5 rounded mb-2">
                  <Text className="text-white text-[8px] font-black tracking-widest uppercase">
                    New
                  </Text>
                </View>
                <Text className="text-white font-manrope font-black text-xl leading-tight">
                  Double Points
                </Text>
                <Text className="text-white/90 font-manrope font-bold text-xs mt-1">
                  every Friday with Scan & Pay
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Recent Activity */}
        <View className="mb-10 px-1">
          <View className="flex-row justify-between items-end mb-4">
            <Text className="text-lg font-manrope font-black text-gray-800">Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/history' as any)}>
              <Text className="text-xs font-manrope font-bold text-[#f48fb1]">See All</Text>
            </TouchableOpacity>
          </View>

          <View className="gap-y-2">
            {RECENT_TRANSACTIONS.map((tx) => (
              <TouchableOpacity
                key={tx.id}
                className="bg-white rounded-[1.5rem] p-4 flex-row items-center justify-between border border-gray-50 shadow-sm"
              >
                <View className="flex-row items-center gap-4">
                  <View className="w-12 h-12 rounded-full bg-pink-50 flex-row items-center justify-center">
                    {tx.category === 'Shopping' ? (
                      <ShoppingBag size={20} color="#f48fb1" />
                    ) : (
                      <Landmark size={20} color="#f48fb1" />
                    )}
                  </View>
                  <View>
                    <Text className="font-manrope font-black text-gray-800 text-sm">
                      {tx.title}
                    </Text>
                    <Text className="font-manrope text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                      {tx.category}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text
                    className={`font-manrope font-black text-base ${tx.type === 'income' ? 'text-green-500' : 'text-gray-800'}`}
                  >
                    {tx.type === 'expense' ? '-' : '+'}
                    {MOCK_USER.currency}
                    {tx.amount.toLocaleString()}
                  </Text>
                  <Text className="font-manrope text-[9px] font-bold text-gray-400 mt-1">
                    {tx.time}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
