import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Share2,
  Download,
  AlertCircle,
  Coffee,
  Landmark,
  ShoppingBag,
  ReceiptText,
  Gamepad2,
  Globe,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

// นำ Mock Data มาไว้ที่นี่ชั่วคราว (ในของจริงควรดึงจาก API หรือ State Management)
const MOCK_TRANSACTIONS = [
  {
    id: '1',
    title: 'Starbucks Coffee',
    category: 'Shopping',
    amount: 155,
    type: 'expense',
    date: 'Today, 10:45 AM',
    icon: <Coffee />,
    ref: 'JL192837465',
  },
  {
    id: '2',
    title: 'Monthly Salary',
    category: 'Deposit',
    amount: 45000,
    type: 'income',
    date: 'Today, 08:00 AM',
    icon: <Landmark />,
    ref: 'JL987654321',
  },
  {
    id: '3',
    title: '7-Eleven Store',
    category: 'Shopping',
    amount: 82,
    type: 'expense',
    date: 'Yesterday, 09:20 PM',
    icon: <ShoppingBag />,
    ref: 'JL456123789',
  },
  {
    id: '4',
    title: 'Electricity Bill',
    category: 'Bills',
    amount: 1240,
    type: 'expense',
    date: '15 Apr, 2024',
    icon: <ReceiptText />,
    ref: 'JL789123456',
  },
  {
    id: '5',
    title: 'Steam Wallet',
    category: 'Games',
    amount: 500,
    type: 'expense',
    date: '14 Apr, 2024',
    icon: <Gamepad2 />,
    ref: 'JL321654987',
  },
  {
    id: '6',
    title: 'Adobe Subscription',
    category: 'Bills',
    amount: 350,
    type: 'expense',
    date: '12 Apr, 2024',
    icon: <Globe />,
    ref: 'JL147258369',
  },
];

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // ค้นหาข้อมูล Transaction จาก ID
  const transaction = MOCK_TRANSACTIONS.find((tx) => tx.id === id);

  if (!transaction) {
    return (
      <SafeAreaView className="flex-1 bg-[#f8f9fe] items-center justify-center">
        <Text className="font-manrope font-black text-gray-500">Transaction not found.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-3 bg-pink-50 rounded-xl"
        >
          <Text className="font-manrope font-black text-[#f48fb1]">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isIncome = transaction.type === 'income';

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
          Transaction Details
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="mt-2"
        >
          {/* Main Detail Card (คล้ายใบเสร็จ) */}
          <View className="bg-white rounded-[2.5rem] p-6 border border-gray-50 shadow-xl shadow-pink-100/40 mb-6 overflow-hidden">
            {/* Header / Icon */}
            <View className="items-center mb-6 pt-2">
              <View
                className={`w-16 h-16 rounded-[1.5rem] items-center justify-center mb-4 border shadow-sm ${isIncome ? 'bg-green-50 border-green-100' : 'bg-pink-50 border-pink-100'}`}
              >
                {React.cloneElement(transaction.icon as React.ReactElement<any>, {
                  size: 28,
                  color: isIncome ? '#22c55e' : '#f48fb1',
                })}
              </View>
              <Text className="text-xl font-manrope font-black text-gray-800 tracking-tight">
                {transaction.title}
              </Text>
              <Text className="text-[10px] font-manrope font-bold text-gray-400 mt-1 uppercase tracking-widest">
                {transaction.category}
              </Text>
            </View>

            {/* Amount */}
            <View className="items-center py-8 border-y border-dashed border-gray-200 mb-6">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-2">
                Total {isIncome ? 'Received' : 'Spent'}
              </Text>

              <View className="flex-row items-center justify-center w-full">
                <Text
                  className={`text-3xl font-manrope font-black mr-1 mt-1 ${isIncome ? 'text-green-500' : 'text-gray-800'}`}
                >
                  {isIncome ? '+' : '-'}฿
                </Text>
                {/* แก้ปัญหาตัวเลขโดนตัดตรงนี้ */}
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                  className={`text-5xl font-manrope font-black tracking-tighter ${isIncome ? 'text-green-500' : 'text-gray-800'}`}
                  style={{
                    lineHeight: 60, // เผื่อพื้นที่บน-ล่างให้ฟอนต์
                    paddingVertical: 0,
                    marginVertical: 0,
                    includeFontPadding: false, // ปิด Padding อัตโนมัติบน Android
                  }}
                >
                  {transaction.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>

            {/* Details List */}
            <View className="gap-y-4 pb-2">
              <DetailRow label="Status" value="Completed" valueColor="text-green-500" />
              <DetailRow label="Date & Time" value={transaction.date} />
              <DetailRow label="Payment Method" value="J-Ledger Wallet" />
              <DetailRow label="Transaction Fee" value="Free" />
              <DetailRow label="Reference ID" value={transaction.ref} />
            </View>

            {/* Watermark */}
            <View className="items-center mt-6 pt-4 border-t border-gray-50">
              <Text className="text-[9px] font-manrope font-black text-gray-300 uppercase tracking-[0.2em]">
                J-Ledger e-Slip
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-4 mb-6">
            <TouchableOpacity className="flex-1 h-14 bg-white rounded-2xl border border-gray-100 items-center justify-center flex-row gap-2 shadow-sm active:scale-95">
              <Share2 size={18} color="#1a1a1a" />
              <Text className="text-xs font-manrope font-black text-gray-800 uppercase tracking-widest">
                Share
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 h-14 bg-white rounded-2xl border border-gray-100 items-center justify-center flex-row gap-2 shadow-sm active:scale-95">
              <Download size={18} color="#1a1a1a" />
              <Text className="text-xs font-manrope font-black text-gray-800 uppercase tracking-widest">
                e-Slip
              </Text>
            </TouchableOpacity>
          </View>

          {/* Report Issue */}
          <TouchableOpacity className="bg-red-50 p-4 rounded-2xl border border-red-100 flex-row items-center justify-center gap-2 shadow-sm active:scale-95 mb-6">
            <AlertCircle size={16} color="#ef4444" />
            <Text className="text-xs font-manrope font-black text-red-500 uppercase tracking-widest">
              Report an issue
            </Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

// Reusable Component สำหรับแสดงข้อมูลแต่ละแถว
function DetailRow({
  label,
  value,
  valueColor = 'text-gray-800',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest flex-1">
        {label}
      </Text>
      <Text className={`text-sm font-manrope font-black flex-2 text-right ${valueColor}`}>
        {value}
      </Text>
    </View>
  );
}
