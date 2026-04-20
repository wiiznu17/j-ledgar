import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth';

import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';

// Import NativeWind Global CSS
import '@/styles/global.css';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create Query Client for TanStack Query
const queryClient = new QueryClient();

export const unstable_settings = {
  anchor: '(tabs)',
};

import { BackgroundGradient } from '@/components/common/BackgroundGradient';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initializeAuth = useAuthStore((state) => state.initialize);

  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <BackgroundGradient>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="transfer" options={{ headerShown: false }} />
              <Stack.Screen name="topup" options={{ headerShown: false }} />
              <Stack.Screen name="transaction" options={{ headerShown: false }} />
              <Stack.Screen name="deal" options={{ headerShown: false }} />
              <Stack.Screen name="my-qr" options={{ headerShown: false }} />
              <Stack.Screen name="notifications" options={{ headerShown: false }} />
              <Stack.Screen
                name="settings"
                options={{ presentation: 'modal', title: 'Settings' }}
              />
              <Stack.Screen name="profile/information" options={{ headerShown: false }} />
            </Stack>
          </BackgroundGradient>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
