import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MotiView } from 'moti';
import { ArrowDownLeft, ArrowUpRight, Search } from 'lucide-react-native';
import {
  formatCreatedAt,
  getAmountColor,
  getTypeMeta,
  type HistoryItem,
} from '@/features/history/presentation';

interface HistoryTransactionListProps {
  transactions: HistoryItem[];
  onTransactionPress: (tx: HistoryItem) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export const HistoryTransactionList = ({
  transactions,
  onTransactionPress,
  refreshing = false,
  onRefresh,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: HistoryTransactionListProps) => {
  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f48fb1" />
      }
      onMomentumScrollEnd={(event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const threshold = 120;
        const reachedBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
        if (reachedBottom && hasMore && !isLoadingMore) {
          onLoadMore?.();
        }
      }}
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
                  {(() => {
                    const Icon = getTypeMeta(tx.type).icon;
                    return <Icon size={22} color="#f48fb1" />;
                  })()}
                  <View
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center border-2 border-white ${tx.direction === 'IN' ? 'bg-green-500' : 'bg-gray-800'}`}
                  >
                    {tx.direction === 'IN' ? (
                      <ArrowDownLeft size={10} color="white" strokeWidth={3} />
                    ) : (
                      <ArrowUpRight size={10} color="white" strokeWidth={3} />
                    )}
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-manrope font-black text-gray-800">{tx.title}</Text>
                  <Text className="text-[10px] font-manrope font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {getTypeMeta(tx.type).label}
                  </Text>
                </View>
              </View>

              <View className="items-end">
                <Text
                  className="font-manrope font-black text-base"
                  style={{ color: getAmountColor(tx.direction, tx.status) }}
                >
                  {tx.direction === 'OUT' ? '-' : '+'}฿
                  {Number(tx.amount || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Text>
                <Text className="text-[9px] font-manrope font-bold text-gray-400 mt-1">
                  {formatCreatedAt(tx.createdAt)}
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

      {hasMore && (
        <View className="items-center py-4">
          <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest">
            {isLoadingMore ? 'Loading more...' : 'Scroll down to load more'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};
