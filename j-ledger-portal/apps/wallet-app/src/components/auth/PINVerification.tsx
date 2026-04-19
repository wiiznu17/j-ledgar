import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MotiView } from 'moti';
import { Lock } from 'lucide-react-native';
import { PinPad } from '../common/PinPad';
import { useAuthStore } from '../../store/auth';

interface PINVerificationProps {
  onSuccess: () => void;
  onFailure?: (error: string) => void;
  onCancel?: () => void;
}

export const PINVerification: React.FC<PINVerificationProps> = ({
  onSuccess,
  onFailure,
  onCancel,
}) => {
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const verifyPin = useAuthStore((state) => state.verifyPin);

  const maxAttempts = 3;
  const remainingAttempts = maxAttempts - attempts;

  const handlePINComplete = async (enteredPin: string) => {
    if (isVerifying || attempts >= maxAttempts) return;

    setIsVerifying(true);

    try {
      const isValid = await verifyPin(enteredPin);

      if (isValid) {
        setIsVerifying(false);
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin('');

        if (newAttempts >= maxAttempts) {
          setIsVerifying(false);
          const message = 'Too many failed PIN attempts. Please try again later.';
          if (onFailure) onFailure(message);
          Alert.alert('Invalid PIN', message, [{ text: 'OK', onPress: onCancel }]);
        } else {
          setIsVerifying(false);
          Alert.alert(
            'Invalid PIN',
            `Incorrect PIN. ${remainingAttempts - 1} attempt${remainingAttempts - 1 !== 1 ? 's' : ''} remaining.`,
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

  if (attempts >= maxAttempts) {
    return (
      <View className="px-6 py-6 bg-red-50/40 rounded-3xl border border-red-100 mb-6 items-center">
        <Text className="text-red-600 font-manrope font-black text-sm text-center">
          Too many failed attempts. Please try again later.
        </Text>
      </View>
    );
  }

  return (
    <View className="px-6 py-6 bg-white/50 rounded-3xl border border-gray-100 mb-6">
      <MotiView
        from={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="items-center"
      >
        {/* Lock Icon */}
        <View className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full items-center justify-center mb-4 shadow-lg shadow-blue-200/50">
          <Lock size={32} color="#3b82f6" />
        </View>

        {/* Title */}
        <Text className="text-lg font-manrope font-black text-gray-800 mb-1">Enter PIN</Text>
        <Text className="text-xs font-manrope font-bold text-gray-500 text-center mb-6">
          Enter your 6-digit PIN to confirm this transfer
        </Text>

        {/* PIN Pad */}
        {isVerifying ? (
          <View className="w-full items-center py-12">
            <ActivityIndicator size="large" color="#f48fb1" />
          </View>
        ) : (
          <PinPad pin={pin} setPin={setPin} length={6} onComplete={handlePINComplete} />
        )}

        {/* Attempts Counter */}
        {attempts > 0 && (
          <Text className="text-xs font-manrope font-bold text-orange-500 text-center mt-4">
            {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
          </Text>
        )}

        {/* Cancel Button */}
        {onCancel && (
          <TouchableOpacity onPress={onCancel} disabled={isVerifying} className="mt-6">
            <Text className="text-gray-500 font-manrope font-bold text-xs">Cancel</Text>
          </TouchableOpacity>
        )}
      </MotiView>
    </View>
  );
};
