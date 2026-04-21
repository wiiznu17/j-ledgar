import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'jledger_device_id';

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
