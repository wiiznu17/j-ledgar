import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="pending-approval" />
      <Stack.Screen name="account-restricted" />
      <Stack.Screen name="recovery" />
    </Stack>
  );
}
