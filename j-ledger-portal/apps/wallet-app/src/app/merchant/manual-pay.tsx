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
import { parseBackendError, TransferError, getErrorInfo } from '@/lib/error-handling';
import { ErrorRecovery } from '@/components/error/ErrorRecovery';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store/auth';
import { BiometricAuth } from '@/components/auth/BiometricAuth';
import { PINVerification } from '@/components/auth/PINVerification';
import {
  isBiometricAvailable,
  isBiometricEnrolled,
} from '@/lib/biometric-auth';
import { TransactionAmountCard } from '@/components/transaction/TransactionAmountCard';
import { TransactionReviewCard } from '@/components/transaction/TransactionReviewCard';
import { StickyActionArea } from '@/components/transaction/StickyActionArea';
import { ProcessingPortal } from '@/components/transaction/ProcessingPortal';

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
  const [isConfirming, setIsConfirming] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<TransferError | null>(null);

  // Authentication states
  const [showBiometric, setShowBiometric] = useState(false);
  const [showPIN, setShowPIN] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const biometricEnabled = useAuthStore((state) => state.biometricEnabled);

  useEffect(() => {
    if (merchantId) {
      loadMerchantPreview();
    } else {
      Alert.alert('Error', 'Invalid merchant ID', [{ text: 'OK', onPress: () => router.back() }]);
    }

    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      const enrolled = await isBiometricEnrolled();
      setBiometricAvailable(available && enrolled);
    };
    checkBiometric();
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
    if (!amount || parseFloat(amount) < 5.00) {
      Alert.alert('Invalid Amount', 'Minimum payment amount is ฿5.00.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    setStep('REVIEW');
  };

  const handleConfirm = async () => {
    if (isSubmitting || isConfirming) return;

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
    performPayment();
  };

  const handleAuthCancel = () => {
    setShowBiometric(false);
    setShowPIN(false);
    setIsConfirming(false);
  };

  const performPayment = async () => {
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
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const parsedError = parseBackendError(err);
      setError(parsedError);
      
      // Show as a proper dialog
      const errorInfo = getErrorInfo(parsedError);
      Alert.alert(
        errorInfo.title,
        errorInfo.message,
        [
          { 
            text: errorInfo.actionLabel, 
            onPress: () => {
              if (parsedError.recoveryAction === 'EDIT') setStep('INPUT');
            }
          },
          { text: 'OK', style: 'cancel' }
        ]
      );
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
      key="input"
      from={{ opacity: 0, translateX: 50 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -50 }}
      transition={{ type: 'timing', duration: 400 }}
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
      <TransactionAmountCard 
        amount={amount}
        onAmountChange={setAmount}
        label="Enter Amount to Pay"
      />

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

      </MotiView>
  );

  const renderReview = () => (
    <MotiView
      key="review"
      from={{ opacity: 0, translateX: 50 }}
      animate={{ opacity: 1, translateX: 0 }}
      exit={{ opacity: 0, translateX: -50 }}
      transition={{ type: 'timing', duration: 400 }}
      className="flex-1"
    >
      {/* Main Review Card */}
      <TransactionReviewCard 
        amount={parseFloat(amount)}
        toName={merchant?.merchantName}
        toType="merchant"
        transactionType="Merchant Payment"
        fee={0}
        note={note}
      />

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
        onPress={() => setStep('INPUT')} 
        className="mt-6 mb-20 items-center"
        disabled={isSubmitting}
      >
        <Text className="text-gray-400 font-manrope font-bold text-sm">Edit Amount</Text>
      </TouchableOpacity>
      
      {error && (
        <View className="mt-6">
          <ErrorRecovery 
            error={error} 
            onRetry={handleConfirm}
            onEdit={() => setStep('INPUT')}
            onDismiss={() => setError(null)}
          />
        </View>
      )}
    </MotiView>
  );

  const renderSuccess = () => (
    <MotiView
      key="success"
      from={{ opacity: 0, scale: 0.9, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
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
                onCancel={handleAuthCancel}
              />
            )}
          </MotiView>
        )}
      </AnimatePresence>

      {/* Shared Sticky Action Area */}
      {step !== 'SUCCESS' && (
        <StickyActionArea 
          isVisible={true}
          label={step === 'INPUT' ? 'Review Payment' : (isConfirming ? 'Authenticating...' : 'Confirm Payment')}
          onPress={step === 'INPUT' ? handleNext : handleConfirm}
          disabled={!amount || parseFloat(amount) < 5.00 || isSubmitting || isConfirming}
          isLoading={isSubmitting}
          isAuthenticating={isConfirming}
        />
      )}

      {/* Shared Processing Portal */}
      <ProcessingPortal 
        isVisible={isSubmitting}
        subtitle="We're securing your transaction and confirming with the merchant..."
      />
    </SafeAreaView>
  );
}

