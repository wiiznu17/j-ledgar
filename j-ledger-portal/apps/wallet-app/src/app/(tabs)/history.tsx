import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import api from '@/lib/axios';

import { HistoryHeader } from '@/components/history/HistoryHeader';
import { HistoryCategoryTabs } from '@/components/history/HistoryCategoryTabs';
import { HistoryTransactionList } from '@/components/history/HistoryTransactionList';
import {
  HISTORY_FILTERS,
  type HistoryFilter,
  type HistoryItem,
} from '@/features/history/presentation';

export default function HistoryScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] =
    useState<HistoryFilter['key']>('ALL');
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchHistory = useCallback(
    async (targetPage: number, replace = false) => {
      try {
        const params: Record<string, string | number> = {
          page: targetPage,
          size: 20,
        };
        if (selectedCategory !== 'ALL') {
          params.type = selectedCategory;
        }
        if (search.trim()) {
          params.q = search.trim();
        }

        const res = await api.get('/integration/history', { params });
        const data = res.data || {};
        const items: HistoryItem[] = data.items || [];
        setTransactions((prev) => (replace ? items : [...prev, ...items]));
        setHasMore(Boolean(data.hasMore));
        setPage(targetPage);
        setError('');
      } catch (err: any) {
        setError(
          err?.response?.data?.message || 'ไม่สามารถโหลดประวัติธุรกรรมได้',
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [search, selectedCategory],
  );

  const refresh = useCallback(
    (pullToRefresh = false) => {
      if (pullToRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      fetchHistory(0, true).finally(() => setIsRefreshing(false));
    },
    [fetchHistory],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      refresh();
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search, selectedCategory, refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) {
      return;
    }
    setIsLoadingMore(true);
    fetchHistory(page + 1, false);
  }, [fetchHistory, hasMore, isLoading, isLoadingMore, page]);

  if (isLoading && transactions.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 bg-transparent items-center justify-center"
        edges={['top']}
      >
        <ActivityIndicator size="large" color="#f48fb1" />
        <Text className="text-sm font-manrope font-bold text-gray-400 mt-4">
          Loading history...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
      <HistoryHeader onBack={() => router.back()} />

      <HistoryCategoryTabs
        categories={HISTORY_FILTERS}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {error ? (
        <View className="px-5 pb-3">
          <View className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <Text className="text-xs font-manrope font-bold text-red-500 text-center">
              {error}
            </Text>
          </View>
        </View>
      ) : null}

      <HistoryTransactionList
        transactions={transactions}
        refreshing={isRefreshing}
        onRefresh={() => refresh(true)}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        onTransactionPress={(tx) => {
          router.push({
            pathname: `/transaction/${tx.id}` as any,
            params: {
              payload: JSON.stringify(tx),
            },
          });
        }}
      />
    </SafeAreaView>
  );
}
