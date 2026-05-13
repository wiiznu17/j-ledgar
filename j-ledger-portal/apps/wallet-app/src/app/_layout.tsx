import { useEffect } from 'react';
import { View, StyleSheet, Text, Image, Alert } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { router, Stack, SplashScreen, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth';
import { useNotifications } from '@/hooks/useNotifications';
import { useAppLock } from '@/hooks/useAppLock';
import { configureAmplify } from '@/lib/amplify-config';

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

import { UserStatus, RegistrationState } from '@repo/dto';

import { PINVerification } from '@/components/auth/PINVerification';

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
    user,
    unlockWithPin,
  } = useAuthStore();
  const segments = useSegments();

  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    initializeAuth();
    configureAmplify();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Auth Protection Logic
  useEffect(() => {
    if (!fontsLoaded || isAuthLoading) return;

    console.log('[RootLayout] Auth Guard Check:', {
      isAuthenticated,
      needsPinVerification,
      status: user?.status,
      registrationState: user?.registrationState,
    });

    // If we need PIN verification and we ARE NOT already on the login screen,
    // we don't redirect anymore, we'll show an overlay.
    // However, if we ARE NOT authenticated at all (no session), we MUST go to login.
    if (!isAuthenticated && !needsPinVerification) {
      if (
        segments[0] !== '(auth)' ||
        (segments[1] !== 'login' && segments[1] !== 'onboarding')
      ) {
        router.replace('/(auth)/login');
      }
    } else if (user && !needsPinVerification) {
      const isAuthGroup = segments[0] === '(auth)';
      const isOnboarding = segments[1] === 'onboarding';
      const isPendingApproval = segments[1] === 'pending-approval';

      // 1. Handle Incomplete Registration Flow
      if (user.registrationState !== RegistrationState.COMPLETED) {
        if (!isOnboarding) {
          router.replace('/(auth)/onboarding');
        }
        return;
      }

      // 2. Handle Final Account Status
      switch (user.status) {
        case UserStatus.ACTIVE:
          if (isAuthGroup) {
            router.replace('/(tabs)');
          }
          break;

        case UserStatus.PENDING_APPROVAL:
        case UserStatus.REJECTED:
          if (!isPendingApproval) {
            router.replace('/(auth)/pending-approval');
          }
          break;

        case UserStatus.DELETED:
          initializeAuth();
          router.replace('/(auth)/login');
          break;

        case UserStatus.BLOCKED:
        case UserStatus.SUSPENDED:
        case UserStatus.INACTIVE:
        default:
          if (segments[1] !== 'account-restricted') {
            router.replace('/(auth)/account-restricted');
          }
          break;
      }
    }
  }, [
    isAuthenticated,
    isAuthLoading,
    fontsLoaded,
    needsPinVerification,
    user?.status,
    user?.registrationState,
  ]);

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
      publishableKey={
        process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
      }
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

              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: 'transparent' },
                  headerShown: false,
                }}
              >
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

              {/* Security PIN Overlay - Preserves underlying route! */}
              {needsPinVerification && segments[1] !== 'login' && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
                  {/* Reuse Background Gradient for consistency */}
                  <View style={StyleSheet.absoluteFill}>
                    <BackgroundGradient />
                  </View>
                  
                  <SafeAreaProvider>
                    <PINVerification
                      onSuccess={() => {
                        console.log('[RootLayout] Overlay Unlock Successful');
                      }}
                      onFailure={(msg) => Alert.alert('PIN Incorrect', msg)}
                      useUnlock={true}
                      headerCenterElement={
                        <View className="flex-row items-center gap-2">
                          <View className="w-8 h-8 bg-pink-50 rounded-lg items-center justify-center border border-pink-100 shadow-sm">
                            <Image
                              source={require('../../assets/images/icon.png')}
                              className="w-5 h-5"
                              resizeMode="contain"
                            />
                          </View>
                          <Text className="text-sm font-manrope font-black text-gray-800 tracking-tight">
                            P-wallet
                          </Text>
                        </View>
                      }
                    />
                  </SafeAreaProvider>
                </View>
              )}
            </View>
            <StatusBar style="auto" />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </StripeProvider>
  );
}
// End of RootLayout
