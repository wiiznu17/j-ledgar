import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppLock } from '@/hooks/useAppLock';

import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

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
  useNotifications();
  useAppLock();

  const { 
    initialize: initializeAuth, 
    isAuthenticated, 
    isLoading: isAuthLoading,
    needsPinVerification,
    hasSession,
  } = useAuthStore();

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

  // Auth Protection Logic
  useEffect(() => {
    if (!fontsLoaded || isAuthLoading) return;

    if (needsPinVerification) {
      // Session exists but needs PIN - go to login which will show PIN step
      router.replace('/(auth)/login');
    } else if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isAuthLoading, fontsLoaded, needsPinVerification]);

  if ((!fontsLoaded && !fontError) || isAuthLoading) {
    return null;
  }

  const navTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: 'transparent',
    },
  };

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'}
      merchantIdentifier="merchant.com.jledger.app"
    >
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider value={navTheme}>
            <View style={{ flex: 1, backgroundColor: 'transparent' }}>
              {/* Standalone Background */}
              <View style={StyleSheet.absoluteFill}>
                <BackgroundGradient />
              </View>
              
              <Stack screenOptions={{ 
                contentStyle: { backgroundColor: 'transparent' },
                headerShown: false 
              }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="transfer" />
                <Stack.Screen name="topup" />
                <Stack.Screen name="transaction" />
                <Stack.Screen name="deal" />
                <Stack.Screen name="my-qr" />
                <Stack.Screen name="notifications" />
                <Stack.Screen
                  name="settings"
                  options={{ presentation: 'modal', title: 'Settings' }}
                />
                <Stack.Screen name="profile/information" />
              </Stack>
            </View>
            <StatusBar style="auto" />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </StripeProvider>
  );
}
