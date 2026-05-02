import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Info, CheckCircle2, Clock } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import Barcode from 'react-native-barcode-svg';
import { MotiView } from 'moti';

export default function RedemptionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const queryClient = useQueryClient();

  // 1. Fetch Redemption Detail
  const { data: redemption, isLoading, isError } = useQuery({
    queryKey: ['redemption', id],
    queryFn: async () => {
      // In our API, we might need a specific endpoint or just find it in my-redemptions
      // For now, let's assume we have an endpoint for single redemption detail
      const { data } = await api.get(`/deals/redemptions/${id}`);
      return data;
    },
    enabled: !!id,
  });

  // 2. Use Redemption Mutation (Confirm Use)
  const confirmUseMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/deals/redemptions/${id}/use`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redemption', id] });
      queryClient.invalidateQueries({ queryKey: ['my-redemptions'] });
      Alert.alert('Success', 'Deal has been marked as used!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update status');
    },
  });

  if (isLoading || !redemption) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#f48fb1" size="large" />
      </SafeAreaView>
    );
  }

  const isUsed = redemption.status === 'USED';
  const isExpired = redemption.status === 'EXPIRED';

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-2 flex-row items-center justify-between bg-white border-b border-gray-50">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-gray-50 items-center justify-center"
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">Redeem Deal</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Card Container */}
        <MotiView 
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-gray-50"
        >
          <Image 
            source={{ uri: redemption.deal?.imageUrl }} 
            className="w-full h-48" 
            resizeMode="cover" 
          />

          <View className="p-8 items-center">
            <View className="bg-pink-50 px-4 py-1.5 rounded-xl mb-4">
              <Text className="text-[#f48fb1] text-[10px] font-manrope font-black uppercase tracking-widest">
                {redemption.deal?.brand?.name || 'Voucher'}
              </Text>
            </View>

            <Text className="text-2xl font-manrope font-black text-gray-800 text-center mb-2">
              {redemption.deal?.title}
            </Text>
            
            <View className="flex-row items-center gap-2 mb-8">
              <Clock size={14} color="#9ca3af" />
              <Text className="text-xs font-manrope font-bold text-gray-400 uppercase tracking-widest">
                Expires: {new Date(redemption.expiresAt).toLocaleDateString()}
              </Text>
            </View>

            {/* Barcode Section */}
            <View className={`w-full p-8 rounded-[2.5rem] items-center justify-center border-2 border-dashed ${isUsed ? 'bg-gray-50 border-gray-200' : 'bg-white border-pink-100'}`}>
              {isUsed ? (
                <View className="items-center py-6">
                  <CheckCircle2 size={48} color="#10b981" />
                  <Text className="text-green-500 font-manrope font-black text-lg mt-4 uppercase tracking-widest">Already Used</Text>
                  <Text className="text-gray-400 font-manrope font-bold text-xs mt-1">Used on {new Date(redemption.usedAt).toLocaleString()}</Text>
                </View>
              ) : isExpired ? (
                <View className="items-center py-6">
                  <Info size={48} color="#ef4444" />
                  <Text className="text-red-500 font-manrope font-black text-lg mt-4 uppercase tracking-widest">Expired</Text>
                </View>
              ) : (
                <>
                  <View className="bg-white p-4 mb-6">
                    <Barcode 
                      value={redemption.redemptionCode} 
                      format="CODE128" 
                      maxWidth={Dimensions.get('window').width - 120}
                      height={80}
                    />
                  </View>
                  <Text className="text-2xl font-manrope font-black text-gray-800 tracking-[8px] mb-2">
                    {redemption.redemptionCode}
                  </Text>
                  <Text className="text-[10px] font-manrope font-bold text-gray-400 uppercase tracking-widest">
                    Show this code to the merchant
                  </Text>
                </>
              )}
            </View>

            {/* Instruction */}
            {!isUsed && !isExpired && (
              <View className="mt-10 px-4">
                <Text className="text-[11px] font-manrope font-bold text-gray-400 text-center leading-relaxed">
                  Please ask the merchant to scan this barcode or enter the code manually. Once used, please tap the button below to confirm.
                </Text>
              </View>
            )}
          </View>
        </MotiView>
      </ScrollView>

      {/* Action Button */}
      {!isUsed && !isExpired && (
        <View className="absolute bottom-10 left-5 right-5">
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Confirm Use',
                'Are you sure you want to mark this deal as used? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Confirm', onPress: () => confirmUseMutation.mutate() }
                ]
              );
            }}
            disabled={confirmUseMutation.isPending}
            className="w-full h-16 bg-[#1a1a1a] rounded-2xl flex-row items-center justify-center shadow-xl active:scale-95"
          >
            {confirmUseMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-sm font-manrope font-black text-white uppercase tracking-widest">
                Confirm Use
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
