import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  ChevronLeft,
  CreditCard,
  MonitorSmartphone,
} from 'lucide-react-native';
import { MerchantService, MerchantTerminal } from '@/lib/merchant-service';

export default function MerchantTerminals() {
  const router = useRouter();
  const [terminals, setTerminals] = useState<MerchantTerminal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTerminals = async () => {
    try {
      const res = await MerchantService.getTerminals();
      setTerminals(res || []);
    } catch (error) {
      console.error('[Merchant Terminals] Fetch Error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchTerminals();
    }, []),
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchTerminals();
  };

  const renderTerminal = ({ item }: { item: MerchantTerminal }) => {
    const isActive = item.status === 'ACTIVE';

    return (
      <View className="bg-white p-5 rounded-[1.5rem] mb-4 border border-gray-100 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View
              className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                isActive ? 'bg-purple-50' : 'bg-gray-50'
              }`}
            >
              <MonitorSmartphone
                size={24}
                color={isActive ? '#8b5cf6' : '#9ca3af'}
              />
            </View>
            <View>
              <Text className="font-manrope font-black text-gray-800 text-lg">
                {item.name}
              </Text>
              <Text className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                ID: {item.hardwareId || item.id.substring(0, 8)}
              </Text>
            </View>
          </View>

          <View
            className={`px-3 py-1.5 rounded-full ${
              isActive ? 'bg-emerald-50' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-[10px] font-black uppercase tracking-wider ${
                isActive ? 'text-emerald-500' : 'text-gray-400'
              }`}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View className="bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200 mt-2">
          <Text className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">
            Configuration (Read-Only)
          </Text>
          <View className="mt-2 flex-row justify-between px-2">
            <Text className="text-xs text-gray-500 font-medium">
              Created On:
            </Text>
            <Text className="text-xs text-gray-800 font-bold">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View className="mt-2 flex-row justify-between px-2">
            <Text className="text-xs text-gray-500 font-medium">
              Authentication:
            </Text>
            <Text className="text-xs text-emerald-500 font-bold">Secured</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-6">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-xl font-black font-manrope text-gray-800">
            My Terminals
          </Text>
        </View>
      </View>

      {/* List */}
      {isLoading && !isRefreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : (
        <FlatList
          data={terminals}
          keyExtractor={(item) => item.id}
          renderItem={renderTerminal}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          onRefresh={onRefresh}
          refreshing={isRefreshing}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4 border border-dashed border-gray-200">
                <CreditCard size={32} color="#9ca3af" />
              </View>
              <Text className="font-manrope font-bold text-gray-400 text-base">
                No terminals configured.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
