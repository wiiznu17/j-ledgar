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
import { TransactionReviewCard } from '@/components/transaction/TransactionReviewCard';
import { StickyActionArea } from '@/components/transaction/StickyActionArea';
import { ProcessingPortal } from '@/components/transaction/ProcessingPortal';

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
          <TransactionReviewCard 
            amount={transferAmount}
            toName={paymentDetail?.merchantName || 'Unknown Merchant'}
            toType="merchant"
            transactionType="Merchant Payment"
            fee={fee}
          />

          {/* Minimum Amount Warning */}
          {totalAmount < 5.00 && (
            <View className="bg-red-50 p-5 rounded-2xl border border-red-100 flex-row items-center gap-4 mb-4">
              <View className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-red-100">
                <Text className="text-xl">⚠️</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-manrope font-black text-red-600 uppercase tracking-widest mb-1">
                  Minimum Amount Required
                </Text>
                <Text className="text-xs font-manrope font-bold text-red-500 leading-relaxed">
                  Merchant payments must be at least ฿5.00. Please contact the merchant.
                </Text>
              </View>
            </View>
          )}

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

      {/* Sticky Action Area */}
      <StickyActionArea 
        isVisible={true}
        label={isConfirming ? 'Authenticating...' : 'Confirm Payment'}
        onPress={handleConfirm}
        disabled={isProcessing || isConfirming || !paymentDetail || totalAmount < 5.00}
        isLoading={isProcessing}
        isAuthenticating={isConfirming}
      />

      {/* Full Screen Processing Portal */}
      <ProcessingPortal 
        isVisible={isProcessing}
        subtitle="We're securing your transaction and confirming with the merchant..."
      />
    </SafeAreaView>
  );
}

