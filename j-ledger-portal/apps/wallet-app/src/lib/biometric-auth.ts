import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricAuthResult {
  success: boolean;
  error?: {
    code:
      | 'NOT_AVAILABLE'
      | 'NOT_ENROLLED'
      | 'FAILED'
      | 'USER_CANCEL'
      | 'FALLBACK'
      | 'LOCKOUT'
      | 'UNKNOWN';
    message: string;
  };
}

/**
 * Check if device supports biometric authentication
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    return compatible;
  } catch (error) {
    console.error('[Biometric] Hardware check failed:', error);
    return false;
  }
};

/**
 * Check if user has enrolled biometric (fingerprint/face)
 */
export const isBiometricEnrolled = async (): Promise<boolean> => {
  try {
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('[Biometric] Enrolled check failed:', error);
    return false;
  }
};

/**
 * Get available biometric types
 */
export const getAvailableBiometricTypes = async (): Promise<string[]> => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const typeNames = types.map((type) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'Fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'Face ID';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'Iris';
        default:
          return 'Biometric';
      }
    });
    return typeNames;
  } catch (error) {
    console.error('[Biometric] Get types failed:', error);
    return [];
  }
};

/**
 * Authenticate user with biometric
 */
export const authenticateWithBiometric = async (): Promise<BiometricAuthResult> => {
  try {
    // Check if biometric is available
    const available = await isBiometricAvailable();
    if (!available) {
      return {
        success: false,
        error: {
          code: 'NOT_AVAILABLE',
          message: 'Biometric authentication is not available on this device',
        },
      };
    }

    // Check if user has enrolled
    const enrolled = await isBiometricEnrolled();
    if (!enrolled) {
      return {
        success: false,
        error: {
          code: 'NOT_ENROLLED',
          message: 'No biometric data enrolled on this device',
        },
      };
    }

    // Perform authentication
    const result = await LocalAuthentication.authenticateAsync({
      disableDeviceFallback: false,
      fallbackLabel: 'Use PIN instead',
    });

    if (result.success) {
      console.log('[Biometric] Authentication successful');
      return { success: true };
    } else {
      if (result.error === 'user_cancel') {
        return {
          success: false,
          error: {
            code: 'USER_CANCEL',
            message: 'Authentication cancelled',
          },
        };
      }
      if (result.error === 'lockout') {
        return {
          success: false,
          error: {
            code: 'LOCKOUT',
            message: 'Too many failed attempts. Please try again later.',
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'FAILED',
          message: 'Biometric authentication failed. Please try again.',
        },
      };
    }
  } catch (error) {
    console.error('[Biometric] Authentication error:', error);
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: 'An error occurred during authentication',
      },
    };
  }
};

/**
 * Get user-friendly error message
 */
export const getBiometricErrorMessage = (error: BiometricAuthResult['error']): string => {
  if (!error) return 'An error occurred';

  switch (error.code) {
    case 'NOT_AVAILABLE':
      return 'Biometric authentication is not available on this device';
    case 'NOT_ENROLLED':
      return 'Please set up biometric authentication in your device settings';
    case 'FAILED':
      return 'Authentication failed. Please try again.';
    case 'USER_CANCEL':
      return 'Authentication was cancelled';
    case 'LOCKOUT':
      return 'Too many failed attempts. Please use PIN instead.';
    case 'FALLBACK':
      return 'Please use PIN instead';
    default:
      return error.message || 'Authentication failed';
  }
};
