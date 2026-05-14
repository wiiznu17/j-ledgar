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
import { ChevronLeft, Info, ArrowRight, Store, ShoppingBag, CheckCircle2, Calendar, Hash, Copy, Wallet, ShieldCheck } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { MerchantService } from '@/lib/merchant-service';
import * as Haptics from 'expo-haptics';

type Step = 'INPUT' | 'REVIEW' | 'SUCCESS';

export default function MerchantManualPayScreen() {
  const router = useRouter();
  const { merchantId } = useLocalSearchParams<{ merchantId: string }>();

  const [step, setStep] = useState<Step>('INPUT');
  const [merchant, setMerchant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

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

  const handleNext = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('REVIEW');
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const result = await MerchantService.confirmManualPayment({
        merchantId,
        amount: parseFloat(amount),
        note,
      });

      if (result.success) {
        setPaymentResult({
          ...result,
          timestamp: new Date().toISOString(),
        });
        setStep('SUCCESS');
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  // --- RENDERING HELPERS ---

  const renderInput = () => (
    <MotiView
      from={{ opacity: 0, translateX: -20 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: 20 }}
    >
      {/* Merchant Card */}
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[2.5rem] p-6 mb-6 items-center border border-gray-50 shadow-xl shadow-pink-50/50"
      >
        <View className="w-20 h-20 bg-pink-50 rounded-full items-center justify-center mb-4 border border-pink-100 shadow-inner">
          <Store size={40} color="#f48fb1" />
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
            style={{ fontSize: 44, minWidth: 120 }}
          />
        </View>

        <View className="flex-row gap-3">
          {['100', '500', '1,000'].map((val) => (
            <TouchableOpacity
              key={val}
              onPress={() => {
                setAmount(val.replace(',', ''));
                Haptics.selectionAsync();
              }}
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

      <TouchableOpacity
        onPress={handleNext}
        className={`w-full h-16 rounded-2xl flex-row items-center justify-center gap-3 shadow-lg 
          ${!amount || parseFloat(amount) <= 0 ? 'bg-gray-200' : 'bg-[#f48fb1] shadow-pink-200 active:scale-95'}`}
      >
        <Text className={`font-manrope font-black text-base ${!amount ? 'text-gray-400' : 'text-white'}`}>
          Review Payment
        </Text>
        <ArrowRight size={20} color={!amount ? '#9ca3af' : 'white'} />
      </TouchableOpacity>
    </MotiView>
  );

  const renderReview = () => (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      className="flex-1"
    >
      {/* Main Review Card */}
      <View className="bg-white rounded-[2.5rem] p-7 border border-gray-100 relative overflow-hidden mb-6 shadow-sm">
        <View className="absolute top-0 left-0 right-0 h-2 bg-[#f48fb1]" />

        <View className="items-center mb-8 pt-4">
          <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-3">
            Payment Amount
          </Text>
          <View className="flex-row items-baseline w-full justify-center">
            <Text className="text-2xl font-manrope font-black text-gray-400 mr-2">฿</Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              className="text-5xl font-manrope font-black text-gray-800 tracking-tighter"
            >
              {parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Transfer Direction Container */}
        <View className="bg-gray-50/80 rounded-[2rem] p-5 border border-gray-100/50 mb-8 relative">
          <View className="absolute left-10 top-12 bottom-12 w-[2px] bg-gray-200 border-dashed border-l-[2px] border-gray-200 z-0" />

          {/* From User */}
          <View className="flex-row items-center relative z-10 mb-6">
            <View className="w-10 h-10 bg-white rounded-xl items-center justify-center border border-gray-100">
              <Wallet size={20} color="#9ca3af" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-0.5">
                From
              </Text>
              <Text className="text-sm font-manrope font-black text-gray-800">My E-Wallet</Text>
            </View>
          </View>

          {/* To Merchant */}
          <View className="flex-row items-center relative z-10">
            <View className="w-10 h-10 bg-pink-50 rounded-xl items-center justify-center border border-pink-100">
              <Store size={20} color="#f48fb1" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-0.5">
                To Merchant
              </Text>
              <Text className="text-sm font-manrope font-black text-gray-800" numberOfLines={1}>
                {merchant?.merchantName}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Board */}
        <View>
          <SummaryRow label="Transaction Type" value="Merchant Payment" />
          <SummaryRow label="Payment Fee" value="FREE" isHighlight />

          <View className="mt-2 pt-5 border-t border-gray-100 flex-row justify-between items-center">
            <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest">
              Total Payment
            </Text>
            <Text className="text-xl font-manrope font-black text-[#f48fb1]">
              ฿{parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      {/* Trust Banner */}
      <View className="bg-green-50/50 p-5 rounded-2xl border border-green-100/50 flex-row items-center gap-4 mb-8">
        <View className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-green-100">
          <ShieldCheck size={20} color="#22c55e" />
        </View>
        <Text className="text-[10px] font-manrope font-bold text-green-700/80 uppercase tracking-widest flex-1 leading-relaxed">
          Secure Merchant Payment Guaranteed
        </Text>
      </View>

      <TouchableOpacity
        disabled={isSubmitting}
        onPress={handleConfirm}
        className={`w-full h-16 rounded-2xl flex-row items-center justify-center gap-3 shadow-xl active:scale-95 ${isSubmitting ? 'bg-pink-300' : 'bg-[#f48fb1]'}`}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Text className="font-manrope font-black text-white text-base">Confirm Payment</Text>
            <ArrowRight size={20} color="white" />
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setStep('INPUT')} className="mt-6 items-center">
        <Text className="text-gray-400 font-manrope font-bold text-sm">Edit Amount</Text>
      </TouchableOpacity>
    </MotiView>
  );

  const renderSuccess = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1"
    >
      <View className="bg-white rounded-[3rem] p-8 border border-gray-50 shadow-2xl shadow-pink-200/30 overflow-hidden">
        {/* Pink Decoration */}
        <View className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -mr-16 -mt-16 opacity-50" />
        
        <View className="items-center mb-8">
          <MotiView
            from={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 200 }}
            className="w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-6"
          >
            <CheckCircle2 size={44} color="#22c55e" />
          </MotiView>
          <Text className="text-2xl font-manrope font-black text-gray-800">Payment Successful</Text>
          <Text className="text-gray-400 font-manrope font-bold mt-1">Receipt Number: {paymentResult?.transactionId?.slice(-8).toUpperCase()}</Text>
        </View>

        <View className="bg-pink-50/50 rounded-3xl p-6 items-center mb-8">
          <Text className="text-gray-400 font-manrope font-black text-[10px] uppercase tracking-[3px] mb-2">Total Amount Paid</Text>
          <Text className="text-4xl font-manrope font-black text-[#f48fb1]">฿{parseFloat(amount).toLocaleString()}</Text>
        </View>

        <View className="gap-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Store size={18} color="#9ca3af" />
              <Text className="font-manrope font-bold text-gray-400">To Merchant</Text>
            </View>
            <Text className="font-manrope font-black text-gray-800">{merchant?.merchantName}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Calendar size={18} color="#9ca3af" />
              <Text className="font-manrope font-bold text-gray-400">Date & Time</Text>
            </View>
            <Text className="font-manrope font-black text-gray-800">
              {new Date().toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Hash size={18} color="#9ca3af" />
              <Text className="font-manrope font-bold text-gray-400">Ref ID</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="font-manrope font-black text-gray-800">{paymentResult?.transactionId?.slice(0, 12)}...</Text>
              <TouchableOpacity><Copy size={14} color="#f48fb1" /></TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="h-[1px] bg-gray-100 my-8 border-dashed border-t border-gray-300" />
        
        <Text className="text-center text-[10px] font-manrope font-bold text-gray-400 leading-relaxed">
          This is an official electronic receipt. You can view your full transaction history in the Activity tab.
        </Text>
      </View>

      <View className="mt-10 gap-4">
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          className="w-full h-16 bg-[#1a1a1a] rounded-2xl items-center justify-center shadow-xl"
        >
          <Text className="font-manrope font-black text-white text-base">Done</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="w-full h-16 bg-white border border-gray-100 rounded-2xl items-center justify-center"
        >
          <Text className="font-manrope font-black text-gray-800 text-base">Share Receipt</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fe]" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-5">
          {/* Header (Hidden on success) */}
          {step !== 'SUCCESS' && (
            <View className="flex-row items-center justify-between pt-2 pb-4">
              <TouchableOpacity
                onPress={() => step === 'REVIEW' ? setStep('INPUT') : router.back()}
                className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"
              >
                <ChevronLeft size={24} color="#1a1a1a" />
              </TouchableOpacity>
              <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
                {step === 'REVIEW' ? 'Review Payment' : 'Pay Merchant'}
              </Text>
              <View className="w-10" />
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60, paddingTop: step === 'SUCCESS' ? 40 : 0 }}
          >
            <AnimatePresence>
              {step === 'INPUT' && renderInput()}
              {step === 'REVIEW' && renderReview()}
              {step === 'SUCCESS' && renderSuccess()}
            </AnimatePresence>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SummaryRow({
  label,
  value,
  isHighlight,
}: {
  label: string;
  value: string;
  isHighlight?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-center mb-4">
      <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest">
        {label}
      </Text>
      <Text
        className={`text-sm font-manrope font-black ${
          isHighlight ? 'text-green-500' : 'text-gray-800'
        }`}
      >
        {value}
      </Text>
    </View>
  );
}
