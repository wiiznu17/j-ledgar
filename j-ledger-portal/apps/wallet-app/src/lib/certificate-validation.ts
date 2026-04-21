import { Platform } from 'react-native';

/**
 * Certificate validation utilities for enhanced security.
 * Note: True certificate pinning requires native code modifications (EAS Build).
 * This provides runtime validation as an additional security layer.
 */

interface CertificateValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates that the API URL uses HTTPS.
 * This is a basic check that prevents accidental HTTP connections.
 */
export function validateHttpsUrl(url: string): CertificateValidationResult {
  try {
    if (!url.startsWith('https://')) {
      return {
        isValid: false,
        error: 'API URL must use HTTPS',
      };
    }

    // Additional checks for known domains in production
    const knownDomains = ['api.jledger.io', 'jledger.io'];
    const urlObj = new URL(url);
    const isProduction = !__DEV__;

    if (isProduction && !knownDomains.some((domain) => urlObj.hostname.includes(domain))) {
      return {
        isValid: false,
        error: 'Unknown production domain',
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Gets the expected certificate fingerprint for the API.
 * In a real implementation, this would contain the actual certificate hashes.
 * For now, this is a placeholder that demonstrates the structure.
 */
export function getExpectedCertificateFingerprints(): string[] {
  if (__DEV__) {
    // Development: Allow any certificate (for local testing)
    return [];
  }

  // Production: Add actual certificate fingerprints here
  // These should be obtained from the server's SSL certificate
  return [
    // Example: 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    // Example: 'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
  ];
}

/**
 * Validates that the connection is using a secure protocol.
 * This is called before making API requests.
 */
export function validateConnectionSecurity(url: string): CertificateValidationResult {
  // Basic HTTPS validation
  const httpsCheck = validateHttpsUrl(url);
  if (!httpsCheck.isValid) {
    return httpsCheck;
  }

  // Platform-specific checks
  if (Platform.OS === 'web') {
    // Web browsers handle SSL/TLS validation automatically
    return { isValid: true };
  }

  // Mobile: Additional runtime checks could be added here
  // For true certificate pinning, native modules would be required

  return { isValid: true };
}

/**
 * Security configuration for API connections.
 */
export const SECURITY_CONFIG = {
  enforceHttps: true,
  allowDevCertificates: __DEV__,
  expectedHostnames: ['api.jledger.io', 'localhost', '10.0.2.2'],
};
