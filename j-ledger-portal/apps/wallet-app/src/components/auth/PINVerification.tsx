import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
// import { MotiView } from 'moti';
import { Lock, AlertTriangle, Clock } from 'lucide-react-native';
import { PinPad } from '../common/PinPad';
import { useAuthStore } from '../../store/auth';
import { useScreenCaptureProtection } from '@/hooks/useScreenCaptureProtection';

interface PINVerificationProps {
  onSuccess: () => void;
  onFailure?: (error: string) => void;
  onCancel?: () => void;
}

const MAX_ATTEMPTS = 5;
const SUSPENSION_MINUTES = 30;

export const PINVerification: React.FC<PINVerificationProps> = ({
  onSuccess,
  onFailure,
  onCancel,
}) => {
  // Prevent screen capture on PIN verification
  useScreenCaptureProtection();

  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspensionEndTime, setSuspensionEndTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(SUSPENSION_MINUTES * 60);
  const verifyPin = useAuthStore((state) => state.verifyPin);

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
    if (isVerifying || attempts >= MAX_ATTEMPTS || isSuspended) return;

    setIsVerifying(true);

    try {
      const isValid = await verifyPin(enteredPin);

      if (isValid) {
        setIsVerifying(false);
        setAttempts(0);
        setPin('');
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin('');

        if (newAttempts >= MAX_ATTEMPTS) {
          // Suspend account
          const endTime = Date.now() + SUSPENSION_MINUTES * 60 * 1000;
          setIsSuspended(true);
          setSuspensionEndTime(endTime);
          setRemainingTime(SUSPENSION_MINUTES * 60);
          setIsVerifying(false);

          const message = `Account suspended for ${SUSPENSION_MINUTES} minutes due to multiple failed PIN attempts.`;
          if (onFailure) onFailure(message);
        } else {
          setIsVerifying(false);
          const remainingAttempts = MAX_ATTEMPTS - newAttempts;
          Alert.alert(
            'Invalid PIN',
            `Incorrect PIN. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`,
            [{ text: 'OK' }],
          );
        }
      }
    } catch (error) {
      setIsVerifying(false);
      setPin('');
      const message = 'An error occurred during PIN verification';
      if (onFailure) onFailure(message);
      Alert.alert('Error', message);
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
            <AlertTriangle size={40} color="#ef4444" />
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
              <Clock size={20} color="#ef4444" />
              <Text className="font-manrope font-bold text-gray-600">Time remaining</Text>
            </View>
            <Text className="text-4xl font-manrope font-black text-red-600">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </Text>
          </View>

          {/* Info */}
          <Text className="text-xs font-manrope font-bold text-gray-500 text-center px-4">
            For security reasons, your account has been temporarily suspended after {MAX_ATTEMPTS}{' '}
            failed PIN attempts.
          </Text>

          {/* Cancel Button */}
          {onCancel && (
            <TouchableOpacity onPress={onCancel} className="mt-8">
              <Text className="text-gray-500 font-manrope font-bold text-sm">Close</Text>
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
          <Text className="text-lg font-manrope font-black text-red-600 mb-2">Account Locked</Text>
          <Text className="text-sm font-manrope font-bold text-gray-500 text-center px-4">
            Initializing suspension...
          </Text>
        </View>
      </View>
    );
  }

  // Normal PIN entry state
  return (
    <View className="w-full">
      {/* Header */}
      <View className="items-center mb-8">
        <View className="w-16 h-16 bg-pink-50 rounded-[1.5rem] items-center justify-center mb-4 border border-pink-100 shadow-sm">
          <Lock size={32} color="#f48fb1" />
        </View>

        <Text className="text-2xl font-manrope font-black text-gray-800 mb-2">Confirm PIN</Text>
        <Text className="text-xs font-manrope font-bold text-gray-500 text-center px-6">
          Enter your 6-digit PIN to secure this transaction
        </Text>
      </View>

      {/* PIN Pad (Now includes Dots internally) */}
      {isVerifying ? (
        <View className="w-full items-center py-16">
          <ActivityIndicator size="large" color="#f48fb1" />
          <Text className="text-xs font-manrope font-bold text-gray-500 mt-4">
            Securing Connection...
          </Text>
        </View>
      ) : (
        <PinPad pin={pin} setPin={setPin} length={6} onComplete={handlePINComplete} />
      )}

      {/* Attempts Counter */}
      {attempts > 0 && (
        <View
          // from={{ opacity: 0, translateY: -5 }}
          // animate={{ opacity: 1, translateY: 0 }}
          className="mt-8 items-center"
        >
          <View className="bg-orange-50 px-6 py-3 rounded-full border border-orange-100">
            <Text className="text-xs font-manrope font-bold text-orange-600">
              {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining
            </Text>
          </View>
        </View>
      )}

      {/* Warning for last attempt */}
      {attempts === MAX_ATTEMPTS - 1 && (
        <View
          // from={{ opacity: 0, translateY: -5 }}
          // animate={{ opacity: 1, translateY: 0 }}
          className="mt-4 bg-red-50 px-4 py-3 rounded-2xl border border-red-100 items-center"
        >
          <Text className="text-xs font-manrope font-bold text-red-600 text-center">
            ⚠️ Next failed attempt will suspend your account for {SUSPENSION_MINUTES} minutes
          </Text>
        </View>
      )}

      {/* Cancel Button */}
      {onCancel && !isVerifying && (
        <TouchableOpacity
          onPress={onCancel}
          className="mt-8 py-3 px-6 rounded-full bg-gray-100/50 self-center active:opacity-70"
        >
          <Text className="text-gray-600 font-manrope font-bold text-sm">Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
