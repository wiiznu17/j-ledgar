import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { validateConnectionSecurity } from './certificate-validation';

/**
 * Network timeout configuration for different request types.
 * Different operations require different timeout values for optimal user experience.
 */
export const NETWORK_TIMEOUTS = {
  // Quick operations (auth checks, balance queries)
  QUICK: 5000, // 5 seconds

  // Standard operations (API calls, data fetching)
  DEFAULT: 10000, // 10 seconds

  // Slow operations (file uploads, complex queries)
  SLOW: 30000, // 30 seconds

  // Very slow operations (KYC uploads, large file transfers)
  VERY_SLOW: 60000, // 60 seconds
} as const;

/**
 * Timeout configuration per request type.
 * Maps specific API endpoints to appropriate timeout values.
 */
export const REQUEST_TIMEOUTS = {
  // Authentication endpoints - should be quick
  '/api/auth/login': NETWORK_TIMEOUTS.QUICK,
  '/api/auth/register': NETWORK_TIMEOUTS.QUICK,
  '/api/auth/refresh': NETWORK_TIMEOUTS.QUICK,
  '/api/auth/logout': NETWORK_TIMEOUTS.QUICK,
  '/api/auth/pin': NETWORK_TIMEOUTS.QUICK,
  '/api/auth/biometric': NETWORK_TIMEOUTS.QUICK,

  // Balance and account queries - should be quick
  '/api/finance/wallets': NETWORK_TIMEOUTS.QUICK,

  // Transaction operations - standard timeout
  '/api/finance/wallets/': NETWORK_TIMEOUTS.DEFAULT,

  // KYC operations - can be slow (file uploads + OCR + Face Comparison)
  '/kyc/upload-id-card': NETWORK_TIMEOUTS.VERY_SLOW,
  '/kyc/submit-selfie': NETWORK_TIMEOUTS.VERY_SLOW,
  '/kyc/confirm-ocr': NETWORK_TIMEOUTS.SLOW,

  // Default for unknown endpoints
  DEFAULT: NETWORK_TIMEOUTS.DEFAULT,
} as const;

/**
 * Gets the appropriate timeout for a given URL or request type.
 */
export function getTimeoutForRequest(url?: string): number {
  if (!url) return REQUEST_TIMEOUTS.DEFAULT;

  // Find matching endpoint
  for (const [endpoint, timeout] of Object.entries(REQUEST_TIMEOUTS)) {
    if (endpoint !== 'DEFAULT' && url.includes(endpoint)) {
      return timeout;
    }
  }

  return REQUEST_TIMEOUTS.DEFAULT;
}

const getBaseUrl = () => {
  if (__DEV__) {
    // Use localhost for iOS simulator on same machine, or IP for real device
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    // Ensure /api/v1 suffix
    return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
  }
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.jledger.io';
  // Ensure /api/v1 suffix
  return baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: NETWORK_TIMEOUTS.DEFAULT,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection header
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Request Interceptor: Attach JWT Token and validate connection security
api.interceptors.request.use(
  async (config) => {
    console.log('[Axios] Request:', {
      baseURL: config.baseURL,
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`,
      method: config.method,
    });

    // Dynamically set timeout based on endpoint
    config.timeout = getTimeoutForRequest(config.url);

    // Validate connection security before making request
    if (config.baseURL) {
      const securityCheck = validateConnectionSecurity(config.baseURL);
      if (!securityCheck.isValid) {
        console.error(
          '[Security] Connection validation failed:',
          securityCheck.error,
        );
        return Promise.reject(
          new Error(`Security validation failed: ${securityCheck.error}`),
        );
      }
    }

    const token = await readToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle errors globally and implement token rotation
api.interceptors.response.use(
  (response) => {
    console.log(
      `[Axios] Success: [${response.config.method?.toUpperCase()}] ${response.config.url}`,
      response.status,
    );

    // Automatically unwrap the standard envelope { success, data, meta }
    if (
      response.data &&
      response.data.success === true &&
      response.data.hasOwnProperty('data')
    ) {
      // Keep a reference to the envelope meta if needed by any advanced logic
      (response as any).meta = response.data.meta;
      // Replace data with the actual payload for components
      response.data = response.data.data;
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Differentiate between initial 401 (warn) and retry 401 (error)
    if (status === 401) {
      if (!originalRequest._retry) {
        console.warn(
          `[Axios] Potential token expiry (401): [${originalRequest?.method?.toUpperCase()}] ${originalRequest?.url}`,
        );
      } else {
        console.error(
          `[Axios] Critical Unauthorized (401): [${originalRequest?.method?.toUpperCase()}] ${originalRequest?.url}`,
          {
            status,
            message: error.message,
            data: error.response?.data,
          },
        );
      }
    } else {
      console.error(
        `[Axios] Error: [${originalRequest?.method?.toUpperCase()}] ${originalRequest?.url}`,
        {
          status,
          message: error.message,
          data: error.response?.data,
        },
      );
    }

    // Standardize error message extraction for components
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data;
      if (data.success === false && data.error?.message) {
        // Flatten error message for easier use in components
        (error as any).apiCode = data.error.code;
        (error as any).apiMessage = data.error.message;
        (error as any).apiDetails = data.error.details;
      } else if (data.message) {
        (error as any).apiMessage = data.message;
      }
    }

    // If error is 401 and we haven't retried yet
    // Do NOT auto-lock or refresh if the request was to login, register or initial auth flows
    const isAuthEndpoint =
      originalRequest.url?.includes('/identity/login') ||
      originalRequest.url?.includes('/identity/register') ||
      originalRequest.url?.includes('/identity/verify-otp') ||
      originalRequest.url?.includes('/identity/device/verify');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      const refreshToken = await readRefreshToken();

      if (refreshToken) {
        try {
          // If already refreshing, queue the request
          if (isRefreshing) {
            return new Promise((resolve) => {
              refreshSubscribers.push((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(api(originalRequest));
              });
            });
          }

          isRefreshing = true;

          // Attempt to refresh the token
          const response = await axios.post(
            `${getBaseUrl()}/identity/refresh`,
            { refreshToken },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
              },
            },
          );

          const {
            accessToken,
            refreshToken: newRefreshToken,
            regToken,
          } = response.data;

          // Store new tokens
          if (Platform.OS === 'web') {
            localStorage.setItem('auth_token', accessToken);
            if (newRefreshToken)
              localStorage.setItem('refresh_token', newRefreshToken);
          } else {
            await SecureStore.setItemAsync('auth_token', accessToken);
            if (newRefreshToken)
              await SecureStore.setItemAsync('refresh_token', newRefreshToken);
          }

          // Use dynamic require to break cycle and update store
          const { useAuthStore: authStore } = require('@/store/auth');
          authStore.getState().setToken(accessToken, newRefreshToken);

          // If a regToken was returned (incomplete registration), update the registration store
          if (regToken) {
            console.log('[Axios] Syncing regToken to RegistrationStore');
            const { useRegistrationStore } = require('@/store/registration');
            useRegistrationStore.getState().setRegToken(regToken);
          }

          // Update Authorization header for original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Process queued requests
          refreshSubscribers.forEach((callback) => callback(accessToken));
          refreshSubscribers = [];

          // Retry original request
          return api(originalRequest);
        } catch (refreshError: any) {
          console.error(
            '[Axios] Refresh failed, logging out:',
            refreshError.response?.data || refreshError.message,
          );

          // If refresh fails, logout
          const { useAuthStore: authStore } = require('@/store/auth');
          if (authStore.getState().isAuthenticated) {
            await authStore.getState().logout();
          }

          refreshSubscribers.forEach((callback) => callback(''));
          refreshSubscribers = [];
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available, logout if we haven't already
        const { useAuthStore: authStore } = require('@/store/auth');
        if (authStore.getState().isAuthenticated) {
          await authStore.getState().logout();
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;

async function readToken() {
  if (Platform.OS === 'web') {
    return localStorage.getItem('auth_token');
  }
  return SecureStore.getItemAsync('auth_token');
}

async function readRefreshToken() {
  if (Platform.OS === 'web') {
    return localStorage.getItem('refresh_token');
  }
  return SecureStore.getItemAsync('refresh_token');
}

async function storeTokens(accessToken: string, refreshToken: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  } else {
    await SecureStore.setItemAsync('auth_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
  }
}

async function clearTokens() {
  if (Platform.OS === 'web') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  } else {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('refresh_token');
  }
}
