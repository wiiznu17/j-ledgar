import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CalendarClock, Trash2, Info, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { api } from '@/lib/axios';

export default function ScheduledTransfersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transfers, setTransfers] = useState<any[]>([]);

  const fetchScheduledTransfers = useCallback(async () => {
    try {
      const res = await api.get('/integration/scheduled-transfers');
      setTransfers(res.data?.data || []);
    } catch (err) {
      console.error('[Scheduled] Fetch error:', err);
      Alert.alert('Error', 'Failed to load scheduled transfers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduledTransfers();
  }, [fetchScheduledTransfers]);

  const handleCancel = (id: string) => {
    Alert.alert(
      'Cancel Transfer',
      'Are you sure you want to cancel this scheduled transfer?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/integration/scheduled-transfers/${id}/cancel`);
              fetchScheduledTransfers();
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel transfer');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50 border-green-100';
      case 'COMPLETED': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'CANCELLED': return 'text-gray-500 bg-gray-50 border-gray-100';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const formatFrequency = (freq: string) => {
    switch (freq) {
      case 'ONCE': return 'One-time';
      case 'DAILY': return 'Daily';
      case 'WEEKLY': return 'Weekly';
      case 'MONTHLY': return 'Monthly';
      default: return freq;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-lg font-manrope font-black text-gray-800">
          Scheduled Transfers
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchScheduledTransfers();
          }} />
        }
      >
        {loading && transfers.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#f48fb1" />
          </View>
        ) : transfers.length === 0 ? (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 items-center justify-center"
          >
            <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
              <CalendarClock size={32} color="#d1d5db" />
            </View>
            <Text className="text-gray-400 font-manrope font-black text-sm text-center">
              No scheduled transfers found
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/transfer')}
              className="mt-6 px-6 py-3 bg-[#f48fb1] rounded-2xl shadow-sm"
            >
              <Text className="text-white font-manrope font-black text-xs">
                Schedule New Transfer
              </Text>
            </TouchableOpacity>
          </MotiView>
        ) : (
          <View className="gap-y-4 mt-2">
            {transfers.map((item, index) => (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 100 }}
                className="bg-white rounded-[2rem] p-5 border border-gray-50 shadow-sm"
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center">
                      <Clock size={18} color="#a855f7" />
                    </View>
                    <View>
                      <Text className="text-sm font-manrope font-black text-gray-800">
                        To: {item.recipientPhone}
                      </Text>
                      <Text className="text-[10px] font-manrope font-bold text-gray-400">
                        {formatFrequency(item.frequency)} • Next: {new Date(item.nextExecutionAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View className={`px-2 py-0.5 rounded-full border ${getStatusColor(item.status)}`}>
                    <Text className="text-[8px] font-manrope font-black uppercase tracking-widest">
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center bg-gray-50/50 p-4 rounded-2xl">
                  <View>
                    <Text className="text-[9px] font-manrope font-black text-gray-400 uppercase tracking-widest">
                      Amount
                    </Text>
                    <Text className="text-lg font-manrope font-black text-gray-800">
                      ฿{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  
                  {item.status === 'ACTIVE' && (
                    <TouchableOpacity
                      onPress={() => handleCancel(item.id)}
                      className="w-10 h-10 bg-white border border-gray-100 rounded-xl items-center justify-center active:scale-95 transition-all"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                {item.note && (
                  <View className="mt-3 flex-row items-center gap-2 px-1">
                    <Info size={12} color="#9ca3af" />
                    <Text className="text-[10px] font-manrope font-bold text-gray-400 italic">
                      {item.note}
                    </Text>
                  </View>
                )}
              </MotiView>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
