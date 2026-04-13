import { Image } from 'expo-image';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/auth';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6">
      <View className="bg-white p-8 rounded-3xl shadow-lg items-center w-full">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Wallet Dashboard</Text>
        <Text className="text-gray-500 mb-8">
          Status: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </Text>

        <TouchableOpacity onPress={handleLogout} className="bg-red-500 py-4 px-8 rounded-xl w-full">
          <Text className="text-white text-center font-bold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
