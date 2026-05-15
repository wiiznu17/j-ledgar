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
  UserCircle,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { useAuthStore } from '../../store/auth';
import { BiometricAuth } from '../../components/auth/BiometricAuth';
import { PINVerification } from '../../components/auth/PINVerification';
import { ErrorRecovery } from '../../components/error/ErrorRecovery';
import {
  isBiometricAvailable,
  isBiometricEnrolled,
} from '../../lib/biometric-auth';
import {
  TransferError,
  logTransaction,
  parseBackendError,
  getRecoveryPath,
} from '../../lib/error-handling';
import { NotificationService } from '../../lib/notification-service';
import { useScreenCaptureProtection } from '@/hooks/useScreenCaptureProtection';
import { api } from '@/lib/axios';
import { TransactionReviewCard } from '@/components/transaction/TransactionReviewCard';
import { StickyActionArea } from '@/components/transaction/StickyActionArea';
import { ProcessingPortal } from '@/components/transaction/ProcessingPortal';

const { width } = Dimensions.get('window');

export default function ReviewTransferScreen() {
  // Prevent screen capture on sensitive transaction review
  useScreenCaptureProtection();

  const router = useRouter();
  const {
    recipient,
    amount,
    note,
    merchantName,
    recipientName,
    recipientMasked,
  } = useLocalSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Error handling
  const [error, setError] = useState<TransferError | null>(null);

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [showPIN, setShowPIN] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const biometricEnabled = useAuthStore((state) => state.biometricEnabled);

  const transferAmount = parseFloat(amount as string) || 0;
  const fee = 0;
  const totalAmount = transferAmount + fee;

  // Check biometric availability on mount
  useEffect(() => {
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      const enrolled = await isBiometricEnrolled();
      setBiometricAvailable(available && enrolled);
    };
    checkBiometric();
  }, []);

  const handleConfirm = async () => {
    if (isProcessing || isConfirming) return;

    // For security, always require authentication
    // Check if authentication is required
    if (biometricAvailable && biometricEnabled) {
      // Show biometric first
      setIsConfirming(true);
      setShowBiometric(true);
      return;
    }

    // Always require PIN for security
    setIsConfirming(true);
    setShowPIN(true);
  };

  const handleBiometricSuccess = () => {
    setShowBiometric(false);
    setIsAuthenticated(true);
    setIsConfirming(false);
    performTransfer();
  };

  const handleBiometricFailure = (error: string) => {
    // Fallback to PIN after 3 failed biometric attempts
    setShowBiometric(false);
    setShowPIN(true);
  };

  const handlePINSuccess = () => {
    setShowPIN(false);
    setIsAuthenticated(true);
    setIsConfirming(false);
    performTransfer();
  };

  const handlePINFailure = (error: string) => {
    // Close authentication modal on PIN failure
    setShowPIN(false);
    setIsConfirming(false);
  };

  const handleAuthCancel = () => {
    setShowBiometric(false);
    setShowPIN(false);
    setIsConfirming(false);
  };

  const performTransfer = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Log transfer initiation
      logTransaction({
        id: '',
        timestamp: Date.now(),
        type: 'TRANSFER',
        status: 'SUCCESS',
        recipient: recipient as string,
        amount: amount as string,
        details: { merchantName, note },
      });

      const idempotencyKey = `p2p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const transferRes = await api.post('/integration/p2p/transfer', {
        recipientPhone: recipient,
        amount: transferAmount,
        note: note || undefined,
        idempotencyKey,
      });
      const transferData = transferRes.data || {};

      setIsProcessing(false);

      // Send success notification
      const recipientDisplay =
        (Array.isArray(recipient) ? recipient[0] : recipient)?.replace(
          /-/g,
          '',
        ) || 'Recipient';
      NotificationService.transferSuccess(recipientDisplay, amount as string);

      router.push({
        pathname: '/transfer/success',
        params: {
          recipient,
          amount,
          note,
          merchantName,
          transactionId: transferData.transactionId,
          createdAt: transferData.createdAt,
          recipientName: transferData?.recipient?.displayName || recipientName,
          recipientMasked:
            transferData?.recipient?.phoneMasked || recipientMasked,
        },
      } as any);
    } catch (err: any) {
      console.error('[Transfer] Error:', err);

      setIsProcessing(false);

      // Parse error response
      const transferError = parseBackendError(err);
      transferError.recoveryAction = 'RETRY';

      // Send error notification
      NotificationService.transferFailed(
        err.message || 'Unknown error occurred',
      );

      // Log failed transfer
      logTransaction({
        id: '',
        timestamp: Date.now(),
        type: 'TRANSFER',
        status: 'FAILURE',
        recipient: recipient as string,
        amount: amount as string,
        error: transferError,
        details: { merchantName, note, errorDetails: err },
      });

      setError(transferError);
    }
  };

  const isButtonDisabled = isProcessing || isConfirming;

  const handleErrorRetry = () => {
    setError(null);
    performTransfer();
  };

  const handleErrorEdit = () => {
    setError(null);
    router.back();
  };

  const handleErrorBack = () => {
    setError(null);
    router.push('/transfer' as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-transparent" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => !isProcessing && router.back()}
          className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"
        >
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text className="text-lg font-manrope font-black text-gray-800 tracking-tight">
          Review Transfer
        </Text>
        <View className="w-10" />
      </View>

      {/* เพิ่ม paddingBottom เผื่อพื้นที่ให้ Action Area ลอยอยู่ด้านล่าง */}
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
            toName={recipientName as string || recipient as string}
            toType="user"
            transactionType="Peer-to-Peer"
            fee={fee}
            note={note as string}
          />

          {/* Trust Banner */}
          <View className="bg-green-50/50 p-5 rounded-2xl border border-green-100/50 flex-row items-center gap-4 shadow-sm mb-4">
            <View className="w-10 h-10 rounded-xl bg-white items-center justify-center border border-green-100">
              <ShieldCheck size={20} color="#22c55e" />
            </View>
            <Text className="text-[10px] font-manrope font-bold text-green-700/80 uppercase tracking-widest flex-1 leading-relaxed">
              Guaranteed by P-wallet Security Standard
            </Text>
          </View>

          {/* Error Display */}
          {error && (
            <ErrorRecovery
              error={error}
              onRetry={handleErrorRetry}
              onEdit={handleErrorEdit}
              onBack={handleErrorBack}
              onDismiss={() => setError(null)}
            />
          )}
        </MotiView>
      </ScrollView>

      {/* Authentication Modal - Outside ScrollView */}
      <AnimatePresence>
        {isConfirming && !error && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white items-center justify-center z-40"
          >
            {showBiometric && biometricAvailable && biometricEnabled && (
              <View className="w-full bg-white rounded-t-[2.5rem] p-6 pt-8">
                <BiometricAuth
                  onSuccess={handleBiometricSuccess}
                  onFailure={handleBiometricFailure}
                  onUsePIN={() => {
                    setShowBiometric(false);
                    setShowPIN(true);
                  }}
                />
              </View>
            )}

            {showPIN && (
              <PINVerification
                onSuccess={handlePINSuccess}
                onFailure={handlePINFailure}
                onCancel={handleAuthCancel}
              />
            )}
          </MotiView>
        )}
      </AnimatePresence>

      {/* Sticky Action Area */}
      <StickyActionArea 
        isVisible={true}
        label={isConfirming ? 'Authenticating...' : 'Confirm Transfer'}
        onPress={handleConfirm}
        disabled={isButtonDisabled}
        isLoading={isProcessing}
        isAuthenticating={isConfirming}
      />

      {/* Full Screen Processing Portal */}
      <ProcessingPortal 
        isVisible={isProcessing}
        title="Encrypting Transaction"
        subtitle="We're verifying your identities and securing the ledger connection..."
      />
    </SafeAreaView>
  );
}

