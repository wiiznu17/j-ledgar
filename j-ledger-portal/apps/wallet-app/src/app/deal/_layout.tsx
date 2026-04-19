import { Stack } from 'expo-router';

export default function DealLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="[id]" />
      <Stack.Screen name="my-deals" />
    </Stack>
  );
}
