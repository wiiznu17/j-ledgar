import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function MerchantLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f8f9fe' },
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="terminals" />
    </Stack>
  );
}
