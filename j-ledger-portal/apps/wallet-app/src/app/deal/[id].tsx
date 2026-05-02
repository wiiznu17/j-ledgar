import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Zap, Info } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { RedemptionConfirmationModal } from '@/components/deal/RedemptionConfirmationModal';
import { RedemptionSuccessOverlay } from '@/components/deal/RedemptionSuccessOverlay';

export default function DealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 1. Fetch Deal Detail
  const { data: deal, isLoading: isDealLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: async () => {
      const { data } = await api.get(`/deals/${id}`);
      return data;
    },
    enabled: !!id,
  });

  // 2. Fetch Points Balance
  const { data: balanceData } = useQuery({
    queryKey: ['loyalty-balance'],
    queryFn: async () => {
      const { data } = await api.get('/loyalty/balance');
      return data;
    },
  });

  // 3. Redeem Mutation
  const redeemMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/deals/${id}/redeem`);
      return data;
    },
    onSuccess: () => {
      setShowConfirm(false);
      setIsSuccess(true);
      
      // Invalidate queries to refresh balance and history
      queryClient.invalidateQueries({ queryKey: ['loyalty-balance'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', id] });

      setTimeout(() => {
        setIsSuccess(false);
        router.replace('/deal/my-deals' as any); // Later rename to my-redemptions if needed
      }, 1800);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to redeem deal. Please try again.';
      Alert.alert('Error', message);
    },
  });

  if (isDealLoading || !deal) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#f48fb1" size="large" />
      </View>
    );
  }

  const handleRedeem = () => {
    redeemMutation.mutate();
  };

  return (
    <View className="flex-1 bg-[#f8f9fe]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Full Image Header */}
        <View className="relative w-full h-[380px] bg-white rounded-b-[3rem] overflow-hidden shadow-sm">
          <Image 
            source={{ uri: deal.imageUrl }} 
            className="w-full h-full" 
            resizeMode="cover" 
          />
          <View className="absolute top-0 left-0 right-0 h-32 bg-black/20" />

          {/* Back Button Floating */}
          <View className="absolute left-5" style={{ top: Math.max(insets.top, 20) }}>
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-11 h-11 bg-white/90 rounded-2xl items-center justify-center shadow-md active:scale-95"
            >
              <ChevronLeft size={24} color="#1a1a1a" />
            </TouchableOpacity>
          </View>

          {/* Tag Badge */}
          <View className="absolute bottom-6 left-6 bg-[#f48fb1] px-4 py-2 rounded-xl shadow-lg shadow-pink-200">
            <Text className="text-white text-[10px] font-manrope font-black uppercase tracking-widest">
              {deal.priority > 5 ? 'HOT DEAL' : 'LIMITED'}
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View className="px-5 pt-8 space-y-6">
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-[10px] font-manrope font-black text-pink-500 uppercase tracking-widest bg-pink-50 px-3 py-1 rounded-lg">
                {deal.brand?.name}
              </Text>
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-lg">
                {deal.category?.name}
              </Text>
            </View>
            <Text className="text-3xl font-manrope font-black text-gray-800 tracking-tight leading-tight">
              {deal.title}
            </Text>
            <Text className="text-sm font-manrope font-bold text-gray-400 mt-2 leading-relaxed">
              {deal.description}
            </Text>
          </View>

          {/* Points Card */}
          <View className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm shadow-pink-100/30 flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <View className="w-14 h-14 bg-pink-50 rounded-[1.2rem] items-center justify-center border border-pink-100">
                <Zap size={22} color="#f48fb1" fill="#f48fb1" />
              </View>
              <View>
                <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-0.5">
                  Required Points
                </Text>
                <Text className="text-2xl font-manrope font-black text-[#f48fb1] tracking-tighter">
                  {deal.pointsRequired.toLocaleString()} <Text className="text-sm">pts</Text>
                </Text>
              </View>
            </View>
            <View className="items-end justify-center">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-0.5">
                My Balance
              </Text>
              <Text className="text-base font-manrope font-black text-gray-800 tracking-tighter">
                {(balanceData?.balance || 0).toLocaleString()} <Text className="text-xs">pts</Text>
              </Text>
            </View>
          </View>

          {/* Terms & Conditions */}
          {deal.termsCondition && (
            <View className="space-y-3 px-1">
              <Text className="text-sm font-manrope font-black text-gray-800 uppercase tracking-widest">
                Terms & Conditions
              </Text>
              <Text className="text-[11px] font-manrope font-bold text-gray-400 leading-relaxed">
                {deal.termsCondition}
              </Text>
            </View>
          )}

          {/* Info Notice */}
          <View className="bg-gray-50 p-5 rounded-[1.8rem] border border-gray-100 flex-row gap-4 mb-6">
            <Info size={20} color="#9ca3af" className="mt-0.5" />
            <Text className="flex-1 text-[11px] font-manrope font-bold text-gray-500 leading-relaxed">
              Once redeemed, points cannot be refunded. The voucher will be available instantly in
              your "My Deals" section.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 pt-4 bg-white/95 border-t border-gray-50"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <TouchableOpacity
          onPress={() => setShowConfirm(true)}
          disabled={deal.remainingStock <= 0}
          className={`w-full h-16 rounded-2xl flex-row items-center justify-center gap-2 shadow-xl active:scale-95 transition-all ${deal.remainingStock <= 0 ? 'bg-gray-300 shadow-gray-100' : 'bg-[#f48fb1] shadow-pink-200'}`}
        >
          <Text className="font-manrope font-black text-base text-white">
            {deal.remainingStock <= 0 ? 'Out of Stock' : 'Redeem This Deal'}
          </Text>
        </TouchableOpacity>
      </View>

      <RedemptionConfirmationModal
        isVisible={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleRedeem}
        points={deal.pointsRequired}
        dealTitle={deal.title}
        isProcessing={redeemMutation.isPending}
      />

      <RedemptionSuccessOverlay isVisible={isSuccess} />
    </View>
  );
}
