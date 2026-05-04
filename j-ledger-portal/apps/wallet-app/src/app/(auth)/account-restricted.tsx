import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuthStore } from '@/store/auth';
import { router } from 'expo-router';
import { ShieldAlert, LogOut, MessageCircle } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function AccountRestrictedScreen() {
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const getStatusMessage = () => {
    switch (user?.status) {
      case 'BLOCKED':
        return 'This account has been blocked due to a violation of our terms of service.';
      case 'SUSPENDED':
        return 'Your account is temporarily suspended. Please contact support for more information.';
      case 'INACTIVE':
        return 'This account is currently inactive. Please contact your administrator to reactivate it.';
      default:
        return 'Access to this account is currently restricted.';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 justify-center items-center">
        <MotiView
          from={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-24 h-24 bg-red-50 rounded-full justify-center items-center mb-8"
        >
          <ShieldAlert size={48} color="#ef4444" />
        </MotiView>

        <Text className="text-3xl font-manrope font-black text-gray-800 text-center mb-4">
          Account Restricted
        </Text>
        
        <Text className="text-gray-500 font-manrope font-medium text-center text-lg mb-12">
          {getStatusMessage()}
        </Text>

        <View className="w-full space-y-4">
          <TouchableOpacity 
            className="w-full bg-gray-900 py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-black/20"
            onPress={() => {
              // Placeholder for contact support
              console.log('Contact Support');
            }}
          >
            <MessageCircle size={20} color="white" className="mr-2" />
            <Text className="text-white font-manrope font-black text-lg ml-2">Contact Support</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleLogout}
            className="w-full bg-gray-50 py-4 rounded-2xl flex-row justify-center items-center border border-gray-100"
          >
            <LogOut size={20} color="#666" className="mr-2" />
            <Text className="text-gray-500 font-manrope font-black text-lg ml-2">Logout</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-12">
          <Text className="text-red-400 font-manrope font-bold text-xs uppercase tracking-widest">
            Status: {user?.status}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
