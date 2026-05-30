import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View, TouchableOpacity, Alert } from 'react-native';
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleExportStatement = async () => {
    setIsLoading(true);
    setShowExportModal(false);
    try {
      await api.post('/integration/history/export-request', {
        year: selectedYear,
        month: selectedMonth,
      });
      Alert.alert(
        'ส่งคำขอสำเร็จ',
        'คำร้องขอส่งออกรายการเดินบัญชีของคุณได้รับการส่งให้ผู้ดูแลระบบตรวจสอบแล้ว ไฟล์ PDF จะจัดส่งไปยังอีเมลของคุณเมื่อได้รับการอนุมัติ',
        [{ text: 'ตกลง' }]
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'ไม่สามารถทำรายการได้ กรุณาลองใหม่อีกครั้ง';
      Alert.alert('เกิดข้อผิดพลาด', msg, [{ text: 'ตกลง' }]);
    } finally {
      setIsLoading(false);
    }
  };

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
      <HistoryHeader onBack={() => router.back()} onExportPress={() => setShowExportModal(true)} />

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

      {/* Export Statement Modal */}
      {showExportModal && (
        <View className="absolute inset-0 bg-black/40 z-50 items-center justify-center px-6">
          <View className="bg-white rounded-[2.5rem] w-full max-w-sm p-7 border border-gray-100 shadow-2xl">
            <Text className="text-xl font-manrope font-black text-gray-800 mb-2 text-center">
              Request Statement
            </Text>
            <Text className="text-xs font-manrope font-bold text-gray-400 mb-8 text-center leading-relaxed">
              ขอรายการเดินบัญชี PDF จัดส่งทางอีเมลหลังจากแอดมินอนุมัติ
            </Text>

            {/* Month Selection */}
            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Select Month</Text>
            <View className="flex-row flex-wrap justify-between gap-y-2 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setSelectedMonth(m)}
                  className={`w-[23%] h-10 rounded-xl items-center justify-center border ${
                    selectedMonth === m ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <Text className={`font-manrope font-bold text-[10px] ${selectedMonth === m ? 'text-[#f48fb1]' : 'text-gray-600'}`}>
                    {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'short' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Year Selection */}
            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Select Year</Text>
            <View className="flex-row gap-2 mb-10">
              {[2025, 2026, 2027].map((yr) => (
                <TouchableOpacity
                  key={yr}
                  onPress={() => setSelectedYear(yr)}
                  className={`flex-1 h-12 rounded-2xl items-center justify-center border ${
                    selectedYear === yr ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <Text className={`font-manrope font-black text-sm ${selectedYear === yr ? 'text-[#f48fb1]' : 'text-gray-800'}`}>
                    {yr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowExportModal(false)}
                className="flex-1 h-14 bg-gray-50 rounded-2xl border border-gray-100 items-center justify-center active:bg-gray-100"
              >
                <Text className="text-gray-500 font-manrope font-black text-xs uppercase tracking-widest">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleExportStatement}
                className="flex-1 h-14 bg-[#f48fb1] rounded-2xl items-center justify-center shadow-lg shadow-pink-100 active:scale-95 transition-all"
              >
                <Text className="text-white font-manrope font-black text-xs uppercase tracking-widest">
                  Request
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
