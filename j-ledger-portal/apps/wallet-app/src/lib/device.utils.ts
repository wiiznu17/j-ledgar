import * as SecureStore from 'expo-secure-store';
import { Platform, Dimensions } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import * as Localization from 'expo-localization';
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
 * Generates a device fingerprint based on hardware characteristics.
 * This is used alongside the stable device ID for additional verification.
 * The fingerprint is deterministic but not personally identifiable.
 */
function generateDeviceFingerprint(): string {
  const components: string[] = [
    Platform.OS,
    String(Platform.Version),
    String(Dimensions.get('window').width),
    String(Dimensions.get('window').height),
    Localization.getLocales()[0]?.languageCode || 'unknown',
    Device.modelName || 'unknown',
    Device.manufacturer || 'unknown',
    Device.osName || 'unknown',
    Device.osVersion || 'unknown',
    Device.deviceName || 'unknown',
  ];

  // Simple hash of components (not cryptographic, but sufficient for fingerprinting)
  const raw = components.join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}

/**
 * Gets a stable, unique device identifier.
 * Combines a persisted UUID with a hardware fingerprint for enhanced security.
 */
export async function getStableDeviceId(): Promise<string> {
  try {
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (!deviceId) {
      const uuid = uuidv4();
      const fingerprint = generateDeviceFingerprint();
      deviceId = `${uuid}:${fingerprint}`;
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
  const model = Device.modelName || (Platform.OS === 'ios' ? 'iPhone' : 'Android');
  const osVersion = Device.osVersion || String(Platform.Version);
  return `${model} - ${osVersion}`;
}

/**
 * Gets the hardware fingerprint portion of the device ID.
 * Useful for server-side device verification.
 */
export function getDeviceFingerprint(): string {
  return generateDeviceFingerprint();
}

/**
 * Gets platform-specific device identifiers for additional verification.
 * Returns null if not available on the platform.
 */
export async function getPlatformDeviceId(): Promise<string | null> {
  try {
    if (Platform.OS === 'android') {
      return Application.getAndroidId();
    }
    if (Platform.OS === 'ios') {
      // iOS doesn't expose identifierForVendor in expo-application
      // The stable device ID in SecureStore serves this purpose
      return null;
    }
    return null;
  } catch {
    return null;
  }
}
