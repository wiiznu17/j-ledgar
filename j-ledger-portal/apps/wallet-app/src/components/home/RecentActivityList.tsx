import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ShoppingBag, Landmark } from 'lucide-react-native';

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: string;
  time: string;
}

interface RecentActivityListProps {
  transactions: Transaction[];
  currency: string;
  onSeeAll: () => void;
  onTransactionPress: (tx: Transaction) => void;
}

export const RecentActivityList = ({
  transactions,
  currency,
  onSeeAll,
  onTransactionPress,
}: RecentActivityListProps) => {
  return (
    <View className="mb-4 px-1">
      <View className="flex-row justify-between items-end mb-4">
        <Text className="text-lg font-manrope font-black text-gray-800">Recent Activity</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text className="text-xs font-manrope font-bold text-[#f48fb1]">See All</Text>
        </TouchableOpacity>
      </View>

      <View className="gap-y-2">
        {transactions.map((tx) => (
          <TouchableOpacity
            key={tx.id}
            onPress={() => onTransactionPress(tx)}
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
                <Text className="font-manrope font-black text-gray-800 text-sm">{tx.title}</Text>
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
                {currency}
                {tx.amount.toLocaleString()}
              </Text>
              <Text className="font-manrope text-[9px] font-bold text-gray-400 mt-1">{tx.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
