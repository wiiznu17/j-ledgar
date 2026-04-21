import * as ScreenCapture from 'expo-screen-capture';
import { Platform } from 'react-native';
import { useEffect } from 'react';

/**
 * Screen capture prevention utilities for sensitive screens.
 *
 * This module provides functions to prevent screen capture on sensitive screens
 * like PIN entry, biometric authentication, and transaction confirmation.
 *
 * IMPORTANT: Screen capture prevention is not 100% effective:
 * - On Android, some devices may still allow screen capture via hardware buttons
 * - On iOS, screen recording can sometimes bypass the prevention
 * - Rooted/jailbroken devices can bypass these protections
 *
 * This should be used as part of a defense-in-depth strategy, not as the sole protection.
 */

/**
 * Prevents screen capture on the current screen.
 * Call this when entering a sensitive screen (PIN entry, biometric auth, etc.).
 */
export async function preventScreenCapture(): Promise<void> {
  if (Platform.OS === 'web') {
    // Web browsers don't support screen capture prevention
    console.warn('[ScreenCapture] Screen capture prevention not supported on web');
    return;
  }

  try {
    await ScreenCapture.preventScreenCaptureAsync();
    console.log('[ScreenCapture] Screen capture prevention enabled');
  } catch (error) {
    console.error('[ScreenCapture] Failed to prevent screen capture:', error);
  }
}

/**
 * Allows screen capture on the current screen.
 * Call this when leaving a sensitive screen.
 */
export async function allowScreenCapture(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await ScreenCapture.allowScreenCaptureAsync();
    console.log('[ScreenCapture] Screen capture prevention disabled');
  } catch (error) {
    console.error('[ScreenCapture] Failed to allow screen capture:', error);
  }
}

/**
 * React hook to automatically manage screen capture prevention.
 * Use this in React components to prevent screen capture when the component is mounted.
 *
 * Usage:
 * ```tsx
 * useScreenCapturePrevention(true); // Enable prevention
 * useScreenCapturePrevention(false); // Disable prevention
 * ```
 */
export function useScreenCapturePrevention(enabled: boolean): void {
  useEffect(() => {
    if (enabled) {
      preventScreenCapture();
    } else {
      allowScreenCapture();
    }

    // Clean up when component unmounts
    return () => {
      allowScreenCapture();
    };
  }, [enabled]);
}

/**
 * Sensitive screens that should have screen capture prevention.
 * This is a constant list for reference and consistency.
 */
export const SENSITIVE_SCREENS = {
  PIN_ENTRY: 'pin-entry',
  BIOMETRIC_AUTH: 'biometric-auth',
  TRANSACTION_CONFIRM: 'transaction-confirm',
  ACCOUNT_DETAILS: 'account-details',
  KYC_UPLOAD: 'kyc-upload',
} as const;
