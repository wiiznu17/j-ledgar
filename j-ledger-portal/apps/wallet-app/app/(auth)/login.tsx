import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/store/auth";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const setToken = useAuthStore((state) => state.setToken);
  const router = useRouter();

  const handleLogin = async () => {
    // Mock login for now
    await setToken("mock_token_123");
    router.replace("/(tabs)");
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
            <Text className="text-gray-700 mb-2 font-medium">Email</Text>
            <TextInput
              placeholder="admin@jledger.io"
              className="border border-gray-200 p-4 rounded-xl bg-gray-50"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="mt-4">
            <Text className="text-gray-700 mb-2 font-medium">Password</Text>
            <TextInput
              placeholder="••••••••"
              secureTextEntry
              className="border border-gray-200 p-4 rounded-xl bg-gray-50"
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            className="bg-primary-600 bg-blue-600 py-4 rounded-xl mt-8 shadow-sm"
          >
            <Text className="text-white text-center font-bold text-lg">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
