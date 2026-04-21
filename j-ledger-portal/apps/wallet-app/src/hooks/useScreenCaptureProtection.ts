import { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';
import { Platform } from 'react-native';

/**
 * Hook to prevent screen capture on sensitive screens.
 * Automatically enables screen capture prevention when mounted
 * and disables it when unmounted.
 *
 * @param enabled - Whether to enable screen capture prevention (default: true)
 */
export function useScreenCaptureProtection(enabled: boolean = true) {
  useEffect(() => {
    // Screen capture prevention is only available on mobile
    if (Platform.OS === 'web') {
      return;
    }

    if (!enabled) {
      return;
    }

    let isActive = false;

    const enableProtection = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        isActive = true;
        console.log('[ScreenCapture] Protection enabled');
      } catch (error) {
        console.error('[ScreenCapture] Failed to enable protection:', error);
      }
    };

    const disableProtection = async () => {
      try {
        await ScreenCapture.allowScreenCaptureAsync();
        isActive = false;
        console.log('[ScreenCapture] Protection disabled');
      } catch (error) {
        console.error('[ScreenCapture] Failed to disable protection:', error);
      }
    };

    enableProtection();

    // Cleanup: disable protection when component unmounts
    return () => {
      if (isActive) {
        disableProtection();
      }
    };
  }, [enabled]);
}
