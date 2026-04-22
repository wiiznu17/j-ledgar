import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react-native';

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: string;
  date: string;
  icon: React.ReactNode;
}

interface HistoryTransactionListProps {
  transactions: Transaction[];
  onTransactionPress: (tx: Transaction) => void;
}

export const HistoryTransactionList = ({
  transactions,
  onTransactionPress,
}: HistoryTransactionListProps) => {
  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-y-2">
        {transactions.map((tx, idx) => (
          <MotiView
            key={tx.id}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: idx * 50 }}
          >
            <TouchableOpacity
              onPress={() => onTransactionPress(tx)}
              className="bg-white border border-gray-50 rounded-[2rem] p-5 flex-row items-center justify-between shadow-sm active:scale-95"
            >
              <View className="flex-row items-center gap-4">
                {/* Icon Container with Overlay */}
                <View className="w-12 h-12 rounded-full bg-pink-50 items-center justify-center relative">
                  {React.isValidElement(tx.icon)
                    ? React.cloneElement(tx.icon as any, { size: 22, color: '#f48fb1' })
                    : null}
                  <View
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center border-2 border-white ${tx.type === 'income' ? 'bg-green-500' : 'bg-gray-800'}`}
                  >
                    {tx.type === 'income' ? (
                      <ArrowDownLeft size={10} color="white" strokeWidth={3} />
                    ) : (
                      <ArrowUpRight size={10} color="white" strokeWidth={3} />
                    )}
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-manrope font-black text-gray-800">{tx.title}</Text>
                  <Text className="text-[10px] font-manrope font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {tx.category}
                  </Text>
                </View>
              </View>

              <View className="items-end">
                <Text
                  className={`font-manrope font-black text-base ${tx.type === 'income' ? 'text-green-500' : 'text-gray-800'}`}
                >
                  {tx.type === 'expense' ? '-' : '+'}฿{tx.amount.toLocaleString()}
                </Text>
                <Text className="text-[9px] font-manrope font-bold text-gray-400 mt-1">
                  {tx.date}
                </Text>
              </View>
            </TouchableOpacity>
          </MotiView>
        ))}
      </View>

      {/* Empty State */}
      {transactions.length === 0 && (
        <View className="items-center justify-center py-20">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Search size={32} color="#d1d5db" />
          </View>
          <Text className="font-manrope font-black text-gray-400 uppercase tracking-widest text-xs">
            No Activity Found
          </Text>
        </View>
      )}
    </ScrollView>
  );
};
