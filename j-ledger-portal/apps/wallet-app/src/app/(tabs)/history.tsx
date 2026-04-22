import React, { useState } from 'react';
import { Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Coffee, Landmark, ShoppingBag, ReceiptText, Gamepad2, Globe } from 'lucide-react-native';

// Components
import { HistoryHeader } from '@/components/history/HistoryHeader';
import { HistorySearchBar } from '@/components/history/HistorySearchBar';
import { HistoryCategoryTabs } from '@/components/history/HistoryCategoryTabs';
import { HistoryTransactionList } from '@/components/history/HistoryTransactionList';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Shopping', 'Bills', 'Deposit', 'Games'];

const MOCK_TRANSACTIONS = [
  {
    id: '1',
    title: 'Starbucks Coffee',
    category: 'Shopping',
    amount: 155,
    type: 'expense',
    date: 'Today, 10:45 AM',
    icon: <Coffee />,
  },
  {
    id: '2',
    title: 'Monthly Salary',
    category: 'Deposit',
    amount: 45000,
    type: 'income',
    date: 'Today, 08:00 AM',
    icon: <Landmark />,
  },
  {
    id: '3',
    title: '7-Eleven Store',
    category: 'Shopping',
    amount: 82,
    type: 'expense',
    date: 'Yesterday, 09:20 PM',
    icon: <ShoppingBag />,
  },
  {
    id: '4',
    title: 'Electricity Bill',
    category: 'Bills',
    amount: 1240,
    type: 'expense',
    date: '15 Apr, 2024',
    icon: <ReceiptText />,
  },
  {
    id: '5',
    title: 'Steam Wallet',
    category: 'Games',
    amount: 500,
    type: 'expense',
    date: '14 Apr, 2024',
    icon: <Gamepad2 />,
  },
  {
    id: '6',
    title: 'Adobe Subscription',
    category: 'Bills',
    amount: 350,
    type: 'expense',
    date: '12 Apr, 2024',
    icon: <Globe />,
  },
];

export default function HistoryScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filteredTransactions = MOCK_TRANSACTIONS.filter((tx) => {
    const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
    const matchesSearch = tx.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <HistoryHeader onBack={() => router.back()} />

      <HistorySearchBar value={search} onChangeText={setSearch} />

      <HistoryCategoryTabs
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <HistoryTransactionList
        transactions={filteredTransactions}
        onTransactionPress={(tx) => {
          router.push(`/transaction/${tx.id}` as any);
        }}
      />
    </SafeAreaView>
  );
}
