import { Stack } from 'expo-router';

export default function MerchantLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f8f9fe' },
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="payment-qr" />
      <Stack.Screen name="payment-confirm" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="terminals" />
    </Stack>
  );
}
