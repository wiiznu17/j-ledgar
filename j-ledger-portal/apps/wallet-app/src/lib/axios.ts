import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const getBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3002';
    }
    return 'http://localhost:3002';
  }
  return process.env.EXPO_PUBLIC_WALLET_API_URL || 'https://api.jledger.io/api/wallet';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  async (config) => {
    const token = await readToken();
    if (token) {
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
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
            `${getBaseUrl()}/auth/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } },
          );

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          // Store new tokens
          await storeTokens(accessToken, newRefreshToken);

          // Update Authorization header for original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Process queued requests
          refreshSubscribers.forEach((callback) => callback(accessToken));
          refreshSubscribers = [];

          // Retry original request
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens and reject
          await clearTokens();
          refreshSubscribers.forEach((callback) => callback(''));
          refreshSubscribers = [];
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available, clear access token
        await clearTokens();
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
