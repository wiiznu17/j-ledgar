import { Platform } from 'react-native';

/**
 * Certificate validation utilities for enhanced security.
 *
 * IMPORTANT: True certificate pinning requires native code modifications via EAS Build.
 * To implement full certificate pinning:
 * 1. Install: npm install react-native-ssl-pinning-fast
 * 2. Configure in app.config.js or app.json with EAS Build
 * 3. Add actual certificate fingerprints from the production server
 * 4. Test thoroughly as certificate rotation can break the app
 *
 * Current implementation provides:
 * - HTTPS enforcement
 * - Domain validation in production
 * - Runtime security checks
 *
 * For production deployment, consider implementing true certificate pinning
 * if the security requirements demand it.
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
 *
 * TO IMPLEMENT TRUE CERTIFICATE PINNING:
 * 1. Get the production server's certificate fingerprint:
 *    openssl s_client -connect api.jledger.io:443 -servername api.jledger.io </dev/null | openssl x509 -noout -fingerprint -sha256
 * 2. Add the fingerprint(s) to the production array below
 * 3. Install react-native-ssl-pinning-fast
 * 4. Use the pinnedCertificate configuration in axios
 *
 * For now, this returns empty array (no pinning) to avoid breaking
 * during development and when certificates rotate.
 */
export function getExpectedCertificateFingerprints(): string[] {
  if (__DEV__) {
    // Development: Allow any certificate (for local testing)
    return [];
  }

  // Production: Add actual certificate fingerprints here
  // Example fingerprints (replace with real ones):
  // - Get from: openssl s_client -connect api.jledger.io:443 | openssl x509 -noout -fingerprint -sha256
  return [
    // 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    // 'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=',
  ];

  // IMPORTANT: When implementing, consider:
  // - Certificate rotation strategy (multiple fingerprints)
  // - Backup plan for when certificates change
  // - App update mechanism to update fingerprints
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
  // Set to true when implementing true certificate pinning
  enableCertificatePinning: false,
};
