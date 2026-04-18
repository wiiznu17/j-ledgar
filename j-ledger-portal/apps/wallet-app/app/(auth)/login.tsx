import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/auth';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/src/lib/axios';

export default function LoginScreen() {
  const setToken = useAuthStore((state) => state.setToken);
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      setErrorMessage('Please enter your phone number and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const deviceId = await getOrCreateDeviceId();
      const response = await api.post('/auth/login', {
        phoneNumber: phoneNumber.trim(),
        password,
        deviceId,
        deviceName: `${Platform.OS}-wallet-app`,
      });

      const accessToken = response.data?.accessToken ?? response.data?.access_token;
      if (!accessToken) {
        throw new Error('Access token not found in response');
      }

      await setToken(accessToken);
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const backendMessage = extractErrorMessage(error);
      setErrorMessage(
        typeof backendMessage === 'string'
          ? backendMessage
          : 'Unable to sign in. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      <View className="flex-1 justify-center">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900">J-Ledger</Text>
          <Text className="text-gray-500 mt-2">Sign in to your wallet</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 mb-2 font-medium">Phone Number</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+66891234567"
              className="border border-gray-200 p-4 rounded-xl bg-gray-50"
              autoCapitalize="none"
              keyboardType="phone-pad"
            />
          </View>

          <View className="mt-4">
            <Text className="text-gray-700 mb-2 font-medium">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              className="border border-gray-200 p-4 rounded-xl bg-gray-50"
            />
          </View>

          {errorMessage ? (
            <Text className="text-red-500 mt-3">{errorMessage}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isSubmitting}
            className="bg-primary-600 bg-blue-600 py-4 rounded-xl mt-8 shadow-sm"
          >
            <Text className="text-white text-center font-bold text-lg">
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

async function getOrCreateDeviceId() {
  const key = 'wallet_device_id';
  const fallback = `device_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;

  if (Platform.OS === 'web') {
    const existing = localStorage.getItem(key);
    if (existing) {
      return existing;
    }
    localStorage.setItem(key, fallback);
    return fallback;
  }

  const existing = await SecureStore.getItemAsync(key);
  if (existing) {
    return existing;
  }
  await SecureStore.setItemAsync(key, fallback);
  return fallback;
}

function extractErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const maybeError = error as {
    response?: {
      data?: {
        message?: string;
        errorCode?: string;
      };
    };
    message?: string;
  };

  return (
    maybeError.response?.data?.message ??
    maybeError.response?.data?.errorCode ??
    maybeError.message
  );
}
