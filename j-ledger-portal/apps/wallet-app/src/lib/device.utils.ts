import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'jledger_device_id';
const STORAGE_TEST_KEY = 'jledger_storage_test';

/**
 * Verifies that secure storage is available and working.
 * Returns true if secure storage is functional, false otherwise.
 */
export async function verifySecureStorage(): Promise<boolean> {
  try {
    const testValue = 'storage_test_' + Date.now();
    await SecureStore.setItemAsync(STORAGE_TEST_KEY, testValue);
    const retrieved = await SecureStore.getItemAsync(STORAGE_TEST_KEY);
    await SecureStore.deleteItemAsync(STORAGE_TEST_KEY);

    return retrieved === testValue;
  } catch (error) {
    console.error('[SecureStorage] Verification failed:', error);
    return false;
  }
}

/**
 * Gets a stable, unique device identifier.
 * Persists even if the app is deleted and reinstalled (via SecureStore).
 */
export async function getStableDeviceId(): Promise<string> {
  try {
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (!deviceId) {
      deviceId = uuidv4();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('Failed to get/set device ID:', error);
    // Fallback to a temporary ID if SecureStore fails
    return `fallback-${Date.now()}`;
  }
}

/**
 * Gets a human-readable device name.
 */
export function getDeviceName(): string {
  return `${Platform.OS === 'ios' ? 'iPhone' : 'Android'} - ${Platform.Version}`;
}
