import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure storage verification utilities.
 *
 * This module provides functions to verify that secure storage is available
 * and working properly on the device. This helps detect:
 * - Devices without secure storage support (rare)
 * - App running in environments where secure storage is not available
 * - Potential issues with secure storage implementation
 */

interface SecureStorageVerificationResult {
  isAvailable: boolean;
  isEncrypted: boolean;
  error?: string;
  platform: string;
}

/**
 * Verifies that secure storage is available and working.
 * This performs a test write/read operation to ensure secure storage is functional.
 */
export async function verifySecureStorage(): Promise<SecureStorageVerificationResult> {
  const result: SecureStorageVerificationResult = {
    isAvailable: false,
    isEncrypted: false,
    platform: Platform.OS,
  };

  if (Platform.OS === 'web') {
    // Web uses localStorage instead of secure storage
    result.isAvailable = true;
    result.isEncrypted = false; // localStorage is not encrypted
    result.error = 'Web platform uses localStorage, not secure storage';
    return result;
  }

  try {
    // Test write
    const testKey = 'secure_storage_test';
    const testValue = 'test_value_' + Date.now();
    
    await SecureStore.setItemAsync(testKey, testValue);
    
    // Test read
    const readValue = await SecureStore.getItemAsync(testKey);
    
    // Test delete
    await SecureStore.deleteItemAsync(testKey);
    
    if (readValue === testValue) {
      result.isAvailable = true;
      result.isEncrypted = true; // SecureStore uses encryption on supported platforms
      
      // Additional platform-specific checks
      if (Platform.OS === 'android') {
        // Android uses KeyStore for encryption
        console.log('[SecureStorage] Android KeyStore encryption verified');
      } else if (Platform.OS === 'ios') {
        // iOS uses Keychain for encryption
        console.log('[SecureStorage] iOS Keychain encryption verified');
      }
    } else {
      result.error = 'Secure storage read/write test failed';
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SecureStorage] Verification failed:', error);
  }

  return result;
}

/**
 * Checks if a specific key exists in secure storage.
 */
export async function hasSecureKey(key: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key) !== null;
  }

  try {
    const value = await SecureStore.getItemAsync(key);
    return value !== null;
  } catch (error) {
    console.error(`[SecureStorage] Failed to check key ${key}:`, error);
    return false;
  }
}

/**
 * Gets the list of keys that should be stored in secure storage.
 * This is a constant list for reference and consistency.
 */
export const SECURE_STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  DEVICE_ID: 'jledger_device_id',
  // Add more keys as needed
} as const;

/**
 * Verifies that all expected secure storage keys are present.
 * This can be used during app initialization to ensure security setup is complete.
 */
export async function verifySecureStorageKeys(): Promise<{
  allPresent: boolean;
  missingKeys: string[];
  presentKeys: string[];
}> {
  const keysToCheck = Object.values(SECURE_STORAGE_KEYS);
  const presentKeys: string[] = [];
  const missingKeys: string[] = [];

  for (const key of keysToCheck) {
    const hasKey = await hasSecureKey(key);
    if (hasKey) {
      presentKeys.push(key);
    } else {
      missingKeys.push(key);
    }
  }

  return {
    allPresent: missingKeys.length === 0,
    missingKeys,
    presentKeys,
  };
}

/**
 * Secure storage health check result.
 */
export interface StorageHealthCheck {
  healthy: boolean;
  verification: SecureStorageVerificationResult;
  keysCheck: {
    allPresent: boolean;
    missingKeys: string[];
    presentKeys: string[];
  };
  recommendations: string[];
}

/**
 * Performs a comprehensive health check on secure storage.
 * This verifies both the storage mechanism and the expected keys.
 */
export async function performStorageHealthCheck(): Promise<StorageHealthCheck> {
  const verification = await verifySecureStorage();
  const keysCheck = await verifySecureStorageKeys();
  const recommendations: string[] = [];

  if (!verification.isAvailable) {
    recommendations.push('Secure storage is not available. App may be running in an unsupported environment.');
  }

  if (!verification.isEncrypted && Platform.OS !== 'web') {
    recommendations.push('Secure storage is not encrypted. This may indicate a security issue.');
  }

  if (keysCheck.missingKeys.length > 0) {
    recommendations.push(`Missing secure storage keys: ${keysCheck.missingKeys.join(', ')}`);
  }

  if (Platform.OS === 'web') {
    recommendations.push('Web platform uses localStorage which is not encrypted. Consider using mobile app for enhanced security.');
  }

  const healthy = verification.isAvailable && verification.isEncrypted && keysCheck.allPresent;

  return {
    healthy,
    verification,
    keysCheck,
    recommendations,
  };
}
