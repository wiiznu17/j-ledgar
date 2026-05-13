import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
  Wallet,
  Store,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { useAuthStore } from '@/store/auth';
import { BiometricAuth } from '@/components/auth/BiometricAuth';
import { PINVerification } from '@/components/auth/PINVerification';
import { ErrorRecovery } from '@/components/error/ErrorRecovery';
import {
  isBiometricAvailable,
  isBiometricEnrolled,
} from '@/lib/biometric-auth';
import {
  TransferError,
  parseBackendError,
} from '@/lib/error-handling';
import { NotificationService } from '@/lib/notification-service';
import { useScreenCaptureProtection } from '@/hooks/useScreenCaptureProtection';
import { MerchantService } from '@/lib/merchant-service';

const { width } = Dimensions.get('window');

export default function MerchantPaymentConfirmScreen() {
  // Prevent screen capture on sensitive transaction review
  useScreenCaptureProtection();

  const router = useRouter();
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  
  const [paymentDetail, setPaymentDetail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Error handling
  const [error, setError] = useState<TransferError | null>(null);

  // Authentication states
  const [showBiometric, setShowBiometric] = useState(false);
  const [showPIN, setShowPIN] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const biometricEnabled = useAuthStore((state) => state.biometricEnabled);

  // Fetch Payment Details on mount
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        if (!paymentId) throw new Error('Missing Payment ID');
        const detail = await MerchantService.getPaymentDetail(paymentId);
        setPaymentDetail(detail);
      } catch (err: any) {
        console.error('[Merchant Payment] Fetch Detail Error:', err);
        const parsedError = parseBackendError(err);
        setError(parsedError);
      } finally {
        setIsLoading(false);
      }
    };
    
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      const enrolled = await isBiometricEnrolled();
      setBiometricAvailable(available && enrolled);
    };
    
    fetchDetail();
    checkBiometric();
  }, [paymentId]);

  const handleConfirm = async () => {
    if (isProcessing || isConfirming || !paymentDetail) return;

    if (biometricAvailable && biometricEnabled) {
      setIsConfirming(true);
      setShowBiometric(true);
      return;
    }

    setIsConfirming(true);
    setShowPIN(true);
  };

  const handleAuthSuccess = () => {
    setShowBiometric(false);
    setShowPIN(false);
    setIsConfirming(false);
    processPayment();
  };

  const processPayment = async () => {
    if (!paymentId) return;
    setIsProcessing(true);
    setError(null);

    try {
      const result = await MerchantService.confirmPayment(paymentId);
      
      setIsProcessing(false);
      NotificationService.transferSuccess(paymentDetail.merchantName, paymentDetail.amount);

      router.push({
        pathname: '/transfer/success',
        params: {
          merchantName: paymentDetail.merchantName,
          amount: paymentDetail.amount,
          transactionId: result.transactionId,
          createdAt: new Date().toISOString(),
        },
      } as any);
    } catch (err: any) {
      console.error('[Merchant Payment] Confirm Error:', err);
      setIsProcessing(false);
      const parsedError = parseBackendError(err);
      setError(parsedError);
      NotificationService.transferFailed(parsedError.message);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8f9fe]">
        <ActivityIndicator size="large" color="#f48fb1" />
        <Text className="mt-4 text-gray-500 font-manrope font-bold">Fetching payment details...</Text>
      </SafeAreaView>
    );
  }

  const transferAmount = parseFloat(paymentDetail?.amount || '0');
  const fee = 0;
  const totalAmount = transferAmount + fee;

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => !isProcessing && router.back()}
          className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center"
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
          Confirm Payment
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="mt-2"
        >
          {/* Main Review Card */}
          <View className="bg-white rounded-[2.5rem] p-7 border border-gray-100 relative overflow-hidden mb-6">
            <View className="absolute top-0 left-0 right-0 h-2 bg-[#f48fb1]" />

            <View className="items-center mb-8 pt-4">
              <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest mb-3">
                Payment Amount
              </Text>
              <View className="flex-row items-baseline w-full justify-center">
                <Text className="text-2xl font-manrope font-black text-gray-400 mr-2">
                  ฿
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                  className="text-5xl font-manrope font-black text-gray-800 tracking-tighter"
                >
                  {transferAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
                  <Text className="text-sm font-manrope font-black text-gray-800">
                    My E-Wallet
                  </Text>
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
                  <Text
                    className="text-sm font-manrope font-black text-gray-800"
                    numberOfLines={1}
                  >
                    {paymentDetail?.merchantName || 'Unknown Merchant'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Summary Board */}
            <View className="space-y-4">
              <SummaryRow label="Transaction Type" value="Merchant Payment" />
              <SummaryRow label="Payment Fee" value="FREE" isHighlight />

              <View className="mt-2 pt-5 border-t border-gray-100 flex-row justify-between items-center">
                <Text className="text-[10px] font-manrope font-black text-gray-400 uppercase tracking-widest">
                  Total Payment
                </Text>
                <Text className="text-xl font-manrope font-black text-[#f48fb1]">
                  ฿
                  {totalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* Trust Banner */}
          <View className="bg-green-50/50 p-5 rounded-2xl border border-green-100/50 flex-row items-center gap-4 mb-4">
            <View className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-green-100">
              <ShieldCheck size={20} color="#22c55e" />
            </View>
            <Text className="text-[10px] font-manrope font-bold text-green-700/80 uppercase tracking-widest flex-1 leading-relaxed">
              Secure Merchant Payment Guaranteed
            </Text>
          </View>

          {/* Error Display */}
          {error && (
            <ErrorRecovery
              error={error}
              onRetry={processPayment}
              onEdit={() => router.back()}
              onBack={() => router.push('/(tabs)' as any)}
              onDismiss={() => setError(null)}
            />
          )}
        </MotiView>
      </ScrollView>

      {/* Authentication Modals */}
      <AnimatePresence>
        {isConfirming && !error && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white items-center justify-center z-40"
          >
            {showBiometric && (
              <BiometricAuth
                onSuccess={handleAuthSuccess}
                onFailure={() => {
                  setShowBiometric(false);
                  setShowPIN(true);
                }}
                onUsePIN={() => {
                  setShowBiometric(false);
                  setShowPIN(true);
                }}
              />
            )}

            {showPIN && (
              <PINVerification
                onSuccess={handleAuthSuccess}
                onFailure={() => {
                    setShowPIN(false);
                    setIsConfirming(false);
                }}
                onCancel={() => {
                    setShowPIN(false);
                    setIsConfirming(false);
                }}
              />
            )}
          </MotiView>
        )}
      </AnimatePresence>

      {/* Floating Action Area */}
      <View
        className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-8 bg-white border-t border-gray-50"
        style={{ paddingBottom: Platform.OS === 'ios' ? 34 : 24 }}
      >
        <TouchableOpacity
          disabled={isProcessing || isConfirming || !paymentDetail}
          onPress={handleConfirm}
          className={`w-full h-16 rounded-2xl flex-row items-center justify-center gap-3 transition-all ${
            isProcessing || isConfirming || !paymentDetail
              ? 'bg-pink-300'
              : 'bg-[#f48fb1] active:scale-95'
          }`}
        >
          {isProcessing ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="font-manrope font-black text-white text-base">
                {isConfirming ? 'Authenticating...' : 'Confirm Payment'}
              </Text>
              {!isConfirming && <ArrowRight size={20} color="white" />}
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Processing Portal */}
      <AnimatePresence>
        {isProcessing && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white items-center justify-center z-50 p-10"
          >
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-24 h-24 bg-pink-50 rounded-[2.5rem] items-center justify-center border border-pink-100 mb-8"
            >
              <ActivityIndicator size="large" color="#f48fb1" />
            </MotiView>
            <Text className="text-2xl font-manrope font-black text-gray-800 tracking-tight text-center">
              Processing Payment
            </Text>
            <Text className="text-sm font-manrope font-bold text-gray-400 mt-3 text-center leading-relaxed">
              We're securing your transaction and confirming with the merchant...
            </Text>
          </MotiView>
        )}
      </AnimatePresence>
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
    <View className="flex-row justify-between items-center">
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
