import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, AlertTriangle, Clock, Fingerprint } from 'lucide-react-native';
import { PINLayout, PINBackButton } from '../common/PINLayout';
import { PINInput } from '../common/PINInput';
import { useAuthStore } from '../../store/auth';
import { Palette } from '@/constants/theme';
import { useScreenCaptureProtection } from '@/hooks/useScreenCaptureProtection';
import {
  isBiometricAvailable,
  isBiometricEnrolled,
  authenticateWithBiometric,
} from '../../lib/biometric-auth';

interface PINVerificationProps {
  onSuccess: () => void;
  onFailure?: (error: string) => void;
  onCancel?: () => void;
  useUnlock?: boolean; // When true, uses unlockWithPin (refreshes session + verifies PIN)
  headerCenterElement?: React.ReactNode;
}

const MAX_ATTEMPTS = 5;
const SUSPENSION_MINUTES = 30;

export const PINVerification: React.FC<PINVerificationProps> = ({
  onSuccess,
  onFailure,
  onCancel,
  useUnlock = false,
  headerCenterElement,
}) => {
  // Prevent screen capture on PIN verification
  useScreenCaptureProtection();

  const router = useRouter();
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionEndTime, setSuspensionEndTime] = useState<number | null>(
    null,
  );
  const [remainingTime, setRemainingTime] = useState<number>(
    SUSPENSION_MINUTES * 60,
  );
  const verifyPin = useAuthStore((state) => state.verifyPin);
  const unlockWithPin = useAuthStore((state) => state.unlockWithPin);
  const biometricEnabled = useAuthStore((state) => state.biometricEnabled);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      const enrolled = await isBiometricEnrolled();
      setBiometricAvailable(available && enrolled);
    };
    checkBiometric();
  }, []);

  const handleBiometricAuth = async () => {
    if (isVerifying || isSuspended) return;
    try {
      const result = await authenticateWithBiometric();
      if (result.success) {
        if (useUnlock) {
          await useAuthStore.getState().unlockWithBiometrics();
        }
        onSuccess();
      }
    } catch (err) {
      console.warn('[Biometric] Auth error:', err);
    }
  };

  useEffect(() => {
    if (useUnlock && biometricEnabled && biometricAvailable) {
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [biometricEnabled, biometricAvailable]);

  // Update remaining suspension time
  React.useEffect(() => {
    if (!isSuspended || !suspensionEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((suspensionEndTime - now) / 1000);

      if (remaining <= 0) {
        setIsSuspended(false);
        setSuspensionEndTime(null);
        setAttempts(0);
        setPin('');
        clearInterval(interval);
      } else {
        setRemainingTime(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSuspended, suspensionEndTime]);

  const handlePINComplete = async (enteredPin: string) => {
    if (isVerifying || isSuspended) return;

    setIsVerifying(true);

    try {
      const isValid = useUnlock
        ? await unlockWithPin(enteredPin)
        : await verifyPin(enteredPin);

      if (isValid) {
        setIsVerifying(false);
        setAttempts(0);
        setPin('');
        onSuccess();
      }
    } catch (error: any) {
      setIsVerifying(false);
      setPin('');

      const serverMessage =
        error.response?.data?.message ||
        'An error occurred during PIN verification';
      const status = error.response?.status;

      if (status === 403) {
        // Locked / Forbidden State
        setIsSuspended(true);
        // Sync dynamic suspension display from backend timeLeft
        const timeLeft = error.response?.data?.timeLeft || 300;
        setSuspensionEndTime(Date.now() + timeLeft * 1000);
        setRemainingTime(timeLeft);

        if (onFailure) onFailure(serverMessage);
        Alert.alert('Account Locked', serverMessage, [{ text: 'OK' }]);
      } else {
        if (onFailure) onFailure(serverMessage);
        Alert.alert('Invalid PIN', serverMessage, [{ text: 'OK' }]);
      }
    }
  };

  // Suspended state
  if (isSuspended) {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;

    return (
      <View className="w-full">
        <View
          // from={{ scale: 0.8, opacity: 0 }}
          // animate={{ scale: 1, opacity: 1 }}
          className="items-center py-12"
        >
          {/* Suspended Icon */}
          <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-6 border-2 border-red-200">
            <AlertTriangle size={40} color={Palette.text.error} />
          </View>

          {/* Title */}
          <Text className="text-2xl font-manrope font-black text-red-600 mb-2">
            Account Suspended
          </Text>
          <Text className="text-sm font-manrope font-bold text-gray-600 text-center mb-8 px-4">
            Too many failed PIN attempts. Please try again later.
          </Text>

          {/* Timer */}
          <View className="bg-red-50/50 border border-red-100 rounded-2xl px-8 py-6 mb-8 items-center w-full mx-4">
            <View className="flex-row items-center gap-2 mb-3">
              <Clock size={20} color={Palette.text.error} />
              <Text className="font-manrope font-bold text-gray-600">
                Time remaining
              </Text>
            </View>
            <Text className="text-4xl font-manrope font-black text-red-600">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </Text>
          </View>

          {/* Info */}
          <Text className="text-xs font-manrope font-bold text-gray-500 text-center px-4">
            For security reasons, your account has been temporarily suspended
            after {MAX_ATTEMPTS} failed PIN attempts.
          </Text>

          {/* Cancel Button */}
          {onCancel && (
            <TouchableOpacity onPress={onCancel} className="mt-8">
              <Text className="text-gray-500 font-manrope font-bold text-sm">
                Close
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Max attempts reached - suspension view
  if (attempts >= MAX_ATTEMPTS) {
    return (
      <View className="w-full">
        <View
          // from={{ scale: 0.8, opacity: 0 }}
          // animate={{ scale: 1, opacity: 1 }}
          className="items-center py-12"
        >
          <View className="w-20 h-20 bg-red-50 rounded-full items-center justify-center mb-6 border-2 border-red-200">
            <AlertTriangle size={40} color="#ef4444" />
          </View>
          <Text className="text-lg font-manrope font-black text-red-600 mb-2">
            Account Locked
          </Text>
          <Text className="text-sm font-manrope font-bold text-gray-500 text-center px-4">
            Initializing suspension...
          </Text>
        </View>
      </View>
    );
  }

  // Normal PIN entry state
  return (
    <PINLayout
      title="Confirm PIN"
      subtitle="Enter your 6-digit PIN to secure this transaction"
      iconElement={<Lock size={32} color={Palette.primary.DEFAULT} />}
      leftElement={
        onCancel && !isVerifying ? <PINBackButton onPress={onCancel} /> : null
      }
    >
      {isVerifying ? (
        <View className="w-full items-center py-16">
          <ActivityIndicator size="large" color={Palette.primary.DEFAULT} />
          <Text className="text-xs font-manrope font-bold text-gray-500 mt-4">
            Securing Connection...
          </Text>
        </View>
      ) : (
        <View className="w-full">
          <PINInput
            pin={pin}
            onPinChange={setPin}
            length={6}
            onComplete={handlePINComplete}
          />

          {/* Biometrics quick trigger icon */}
          {biometricEnabled && biometricAvailable && (
            <View className="items-center mt-4 mb-2">
              <TouchableOpacity
                onPress={handleBiometricAuth}
                className="w-12 h-12 bg-pink-50 rounded-full items-center justify-center border border-pink-100 shadow-sm active:bg-pink-100"
              >
                <Fingerprint size={24} color={Palette.primary.DEFAULT} />
              </TouchableOpacity>
              <Text className="text-[10px] font-manrope font-bold text-gray-400 mt-2 uppercase tracking-wider">
                Tap to scan face / fingerprint
              </Text>
            </View>
          )}

          {/* Attempts Counter */}
          {attempts > 0 && (
            <View className="mt-8 items-center">
              <View className="bg-orange-50 px-6 py-3 rounded-full border border-orange-100">
                <Text className="text-xs font-manrope font-bold text-orange-600">
                  {MAX_ATTEMPTS - attempts} attempt
                  {MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining
                </Text>
              </View>
            </View>
          )}

          {/* Warning for last attempt */}
          {attempts === MAX_ATTEMPTS - 1 && (
            <View className="mt-4 bg-red-50 px-4 py-3 rounded-2xl border border-red-100 items-center mx-6">
              <Text className="text-xs font-manrope font-bold text-red-600 text-center">
                ⚠️ Next failed attempt will suspend your account for{' '}
                {SUSPENSION_MINUTES} minutes
              </Text>
            </View>
          )}

          {/* Forgot PIN Link */}
          <TouchableOpacity
            onPress={() => router.push('/profile/reset-pin' as any)}
            className="mt-6 items-center"
          >
            <Text className="text-[#f48fb1] font-manrope font-bold text-xs underline">
              Forgot PIN? / ลืมรหัส PIN?
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </PINLayout>
  );
};
