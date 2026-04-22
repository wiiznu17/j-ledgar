import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
// import { MotiView } from 'moti';
import { Shield } from 'lucide-react-native';
import {
  authenticateWithBiometric,
  getBiometricErrorMessage,
  getAvailableBiometricTypes,
} from '../../lib/biometric-auth';

interface BiometricAuthProps {
  onSuccess: () => void;
  onFailure?: (error: string) => void;
  onUsePIN?: () => void;
}

export const BiometricAuth: React.FC<BiometricAuthProps> = ({ onSuccess, onFailure, onUsePIN }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  React.useEffect(() => {
    // Get biometric type label
    getAvailableBiometricTypes().then((types) => {
      if (types.length > 0) {
        setBiometricType(types[0] || 'Biometric');
      }
    });
  }, []);

  const handleAuthenticate = async () => {
    if (isAuthenticating || attempts >= maxAttempts) return;

    setIsAuthenticating(true);

    try {
      const result = await authenticateWithBiometric();

      if (result.success) {
        setIsAuthenticating(false);
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= maxAttempts) {
          setIsAuthenticating(false);
          const message = 'Too many failed attempts. Please use PIN instead.';
          if (onFailure) onFailure(message);
          Alert.alert('Authentication Failed', message, [
            {
              text: 'Use PIN',
              onPress: () => onUsePIN?.(),
            },
            { text: 'Try Again', style: 'cancel' },
          ]);
        } else {
          setIsAuthenticating(false);
          const message = getBiometricErrorMessage(result.error);
          Alert.alert('Authentication Failed', message, [
            {
              text: 'Try Again',
              onPress: () => handleAuthenticate(),
            },
            {
              text: 'Use PIN',
              onPress: () => onUsePIN?.(),
            },
          ]);
        }
      }
    } catch (error) {
      setIsAuthenticating(false);
      const message = 'An unexpected error occurred';
      if (onFailure) onFailure(message);
      Alert.alert('Error', message);
    }
  };

  const remainingAttempts = maxAttempts - attempts;

  return (
    <View className="px-6 py-6 bg-white/50 rounded-3xl border border-gray-100 mb-6">
      <View
        // from={{ scale: 0.8, opacity: 0 }}
        // animate={{ scale: 1, opacity: 1 }}
        className="items-center"
      >
        {/* Biometric Icon */}
        <View className="w-16 h-16 bg-gradient-to-br from-pink-100 to-pink-50 rounded-full items-center justify-center mb-4 shadow-lg shadow-pink-200/50">
          <Shield size={32} color="#f48fb1" />
        </View>

        {/* Title */}
        <Text className="text-lg font-manrope font-black text-gray-800 mb-2">Confirm Identity</Text>
        <Text className="text-xs font-manrope font-bold text-gray-500 text-center mb-6">
          Use your {biometricType.toLowerCase()} to confirm this transfer
        </Text>

        {/* Authenticate Button */}
        <TouchableOpacity
          onPress={handleAuthenticate}
          disabled={isAuthenticating || attempts >= maxAttempts}
          className={`w-full py-3 rounded-2xl items-center justify-center mb-3 transition-all ${
            isAuthenticating || attempts >= maxAttempts
              ? 'bg-gray-200 opacity-60'
              : 'bg-[#f48fb1] active:scale-95 shadow-lg shadow-pink-200'
          }`}
        >
          {isAuthenticating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-manrope font-black text-sm">
              {isAuthenticating ? 'Authenticating...' : 'Verify with ' + biometricType}
            </Text>
          )}
        </TouchableOpacity>

        {/* Attempts Counter */}
        {attempts > 0 && attempts < maxAttempts && (
          <Text className="text-xs font-manrope font-bold text-orange-500 text-center">
            {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
          </Text>
        )}

        {/* Use PIN Fallback */}
        {onUsePIN && (
          <TouchableOpacity
            onPress={() => {
              setIsAuthenticating(false);
              onUsePIN();
            }}
            disabled={isAuthenticating}
            className="mt-3"
          >
            <Text className="text-[#f48fb1] font-manrope font-bold text-xs">Use PIN instead</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
