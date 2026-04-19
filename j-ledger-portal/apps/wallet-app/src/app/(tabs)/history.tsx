import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  Filter, 
  ShoppingBag, 
  Landmark, 
  Star, 
  ReceiptText, 
  Coffee, 
  Gamepad2, 
  Globe,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearTransition } from 'react-native-reanimated';
import { Header } from '@/components/common/Header';
import { AppTextInput } from '@/components/common/AppTextInput';
import { GlassPanel } from '@/components/common/GlassPanel';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Shopping', 'Bills', 'Deposit', 'Games'];

const MOCK_TRANSACTIONS = [
  { id: '1', title: 'Starbucks Coffee', category: 'Shopping', amount: 155, type: 'expense', date: 'Today, 10:45 AM', icon: <Coffee /> },
  { id: '2', title: 'Monthly Salary', category: 'Deposit', amount: 45000, type: 'income', date: 'Today, 08:00 AM', icon: <Landmark /> },
  { id: '3', title: '7-Eleven Store', category: 'Shopping', amount: 82, type: 'expense', date: 'Yesterday, 09:20 PM', icon: <ShoppingBag /> },
  { id: '4', title: 'Electricity Bill', category: 'Bills', amount: 1240, type: 'expense', date: '15 Apr, 2024', icon: <ReceiptText /> },
  { id: '5', title: 'Steam Wallet', category: 'Games', amount: 500, type: 'expense', date: '14 Apr, 2024', icon: <Gamepad2 /> },
  { id: '6', title: 'Adobe Subscription', category: 'Bills', amount: 350, type: 'expense', date: '12 Apr, 2024', icon: <Globe /> },
];

export default function HistoryScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filteredTransactions = MOCK_TRANSACTIONS.filter(tx => {
    const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
    const matchesSearch = tx.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-[#f5f6fc]">
      <Header title="History" showSearch={false} />
      
      {/* Search Bar */}
      <View className="px-6 pt-2 pb-6">
        <GlassPanel intensity={20} className="p-1">
           <AppTextInput 
              placeholder="Search history..."
              value={search}
              onChangeText={setSearch}
              className="font-manrope font-medium"
              containerClassName="border-0 bg-transparent"
              leftElement={<Search size={18} color="#4855a5" />}
           />
        </GlassPanel>
      </View>

      {/* Category Tabs */}
      <View className="mb-8">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className="items-center"
            >
              <MotiView
                animate={{ 
                  backgroundColor: selectedCategory === cat ? '#4855a5' : 'rgba(255,255,255,0.4)',
                  borderColor: selectedCategory === cat ? '#4855a5' : 'rgba(255,255,255,0.1)',
                }}
                className={`px-6 py-2.5 rounded-2xl border`}
              >
                <Text className={`font-manrope font-black text-[10px] uppercase tracking-widest ${selectedCategory === cat ? 'text-white' : 'text-on-surface'}`}>
                  {cat}
                </Text>
              </MotiView>
              {selectedCategory === cat && (
                <MotiView 
                   layout={LinearTransition}
                   className="w-1 h-1 rounded-full bg-secondary mt-2" 
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="space-y-4">
          {filteredTransactions.map((tx, idx) => (
            <MotiView
              key={tx.id}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: idx * 50 }}
            >
              <TouchableOpacity 
                className="bg-white/40 border border-outline-variant/5 rounded-[28] p-5 flex-row items-center justify-between shadow-sm active:scale-95"
              >
                <View className="flex-row items-center gap-5">
                  <View className="w-14 h-14 rounded-2xl bg-[#eff0f7] items-center justify-center relative">
                     {React.cloneElement(tx.icon as any, { size: 24, color: '#4855a5' })}
                     <View className={`absolute bottom-[-2] right-[-2] w-6 h-6 rounded-full items-center justify-center border-2 border-white ${tx.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {tx.type === 'income' ? <ArrowDownLeft size={12} color="white" /> : <ArrowUpRight size={12} color="white" />}
                     </View>
                  </View>
                  <View>
                    <Text className="text-base font-manrope font-black text-on-surface">{tx.title}</Text>
                    <Text className="text-[10px] font-manrope font-bold text-on-surfaceVariant/60 uppercase tracking-widest mt-1">{tx.date}</Text>
                  </View>
                </View>
                <View className="items-end">
                   <Text className={`font-manrope font-black text-base ${tx.type === 'income' ? 'text-green-600' : 'text-on-surface'}`}>
                     {tx.type === 'expense' ? '-' : '+'}฿{tx.amount.toLocaleString()}
                   </Text>
                   <Text className="text-[9px] font-manrope font-black text-on-surfaceVariant/30 uppercase tracking-tighter mt-1">Success</Text>
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>

        {filteredTransactions.length === 0 && (
          <View className="items-center justify-center py-20">
             <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-6">
                <Search size={32} color="#4855a540" />
             </View>
             <Text className="font-manrope font-black text-on-surfaceVariant/40 uppercase tracking-widest">No Activity Found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
