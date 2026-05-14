import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Info, ArrowRight, Store, ShoppingBag } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView } from 'moti';
import { MerchantService } from '@/lib/merchant-service';

export default function MerchantManualPayScreen() {
  const router = useRouter();
  const { merchantId } = useLocalSearchParams<{ merchantId: string }>();

  const [merchant, setMerchant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (merchantId) {
      loadMerchantPreview();
    } else {
      Alert.alert('Error', 'Invalid merchant ID', [{ text: 'OK', onPress: () => router.back() }]);
    }
  }, [merchantId]);

  const loadMerchantPreview = async () => {
    try {
      const data = await MerchantService.previewManualPayment(merchantId);
      setMerchant(data);
    } catch (error) {
      console.error('[Manual Pay] Load error:', error);
      Alert.alert('Error', 'Could not load merchant information', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real flow, we might navigate to a 'review' screen first.
      // But for this merchant flow, we'll go straight to confirm or simulate the review params.
      // To keep it consistent with P2P, let's navigate to a review-like state or just confirm.
      
      const result = await MerchantService.confirmManualPayment({
        merchantId,
        amount: parseFloat(amount),
        note,
      });

      if (result.success) {
        // Navigate to success screen (reusing transfer success or similar)
        // For now, let's show a success alert and go home
        Alert.alert('Payment Successful', `Sent ฿${amount} to ${merchant.merchantName}`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Payment Error', error.message || 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#f48fb1" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-5">
          {/* Header */}
          <View className="flex-row items-center justify-between pt-2 pb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"
            >
              <ChevronLeft size={24} color="#1a1a1a" />
            </TouchableOpacity>
            <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
              Pay Merchant
            </Text>
            <View className="w-10" />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Merchant Card */}
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[2.5rem] p-6 mb-6 items-center border border-gray-50 shadow-xl shadow-pink-50/50"
            >
              <View className="w-20 h-20 bg-pink-50 rounded-full items-center justify-center mb-4 border border-pink-100 shadow-inner">
                {merchant?.logoUrl ? (
                  <Store size={40} color="#f48fb1" />
                ) : (
                  <ShoppingBag size={40} color="#f48fb1" />
                )}
              </View>
              <Text className="text-xl font-manrope font-black text-gray-800 text-center">
                {merchant?.merchantName}
              </Text>
              <View className="bg-pink-50 px-3 py-1 rounded-full mt-2">
                <Text className="text-[10px] font-manrope font-black text-[#f48fb1] uppercase tracking-widest">
                  {merchant?.category || 'Merchant'}
                </Text>
              </View>
            </MotiView>

            {/* Amount Input */}
            <View className="bg-white rounded-[2.5rem] p-8 mb-6 items-center border border-gray-50 shadow-sm">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-4">
                Enter Amount to Pay
              </Text>

              <View className="flex-row items-center justify-center border-b-2 border-pink-100 pb-2 mb-6 w-full max-w-[220px]">
                <Text className="text-2xl font-manrope font-black text-gray-400 mr-2">฿</Text>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor="#d1d5db"
                  value={amount}
                  onChangeText={(text) => {
                    const filtered = text.replace(/[^0-9.]/g, '');
                    if (filtered.split('.').length > 2) return;
                    setAmount(filtered);
                  }}
                  keyboardType="decimal-pad"
                  selectionColor="#f48fb1"
                  className="font-manrope font-black text-[#f48fb1] text-center"
                  style={{
                    fontSize: 44,
                    minWidth: 120,
                  }}
                  autoFocus
                />
              </View>

              <View className="flex-row gap-3">
                {['100', '500', '1,000'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setAmount(val.replace(',', ''))}
                    className="px-5 py-3 rounded-2xl bg-pink-50 border border-pink-100 active:scale-95"
                  >
                    <Text className="text-[11px] font-manrope font-black text-[#f48fb1]">
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Note Input */}
            <View className="bg-white rounded-2xl px-5 py-4 border border-gray-50 shadow-sm mb-6 flex-row items-center">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase mr-3">Note:</Text>
              <TextInput
                placeholder="Message to merchant..."
                placeholderTextColor="#9ca3af"
                value={note}
                onChangeText={setNote}
                className="flex-1 font-manrope font-bold text-sm text-gray-800"
              />
            </View>

            {/* Security Info */}
            <View className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex-row items-center gap-3 mb-8">
              <Info size={16} color="#3b82f6" />
              <Text className="text-[10px] font-manrope font-bold text-gray-500 leading-relaxed flex-1">
                Your payment is secure. Funds will be transferred instantly to the merchant's verified account.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              onPress={handleNext}
              className={`w-full h-16 rounded-2xl flex-row items-center justify-center gap-3 shadow-lg transition-all
                ${isSubmitting || !amount || parseFloat(amount) <= 0
                  ? 'bg-gray-200'
                  : 'bg-[#f48fb1] shadow-pink-200 active:scale-95'
                }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className={`font-manrope font-black text-base ${!amount ? 'text-gray-400' : 'text-white'}`}>
                    Pay Now
                  </Text>
                  <ArrowRight size={20} color={!amount ? '#9ca3af' : 'white'} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.back()}
              className="mt-6 items-center"
            >
              <Text className="text-gray-400 font-manrope font-bold text-sm">Cancel Payment</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
