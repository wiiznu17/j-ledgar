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

// Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearToken();
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

async function clearToken() {
  if (Platform.OS === 'web') {
    localStorage.removeItem('auth_token');
    return;
  }
  await SecureStore.deleteItemAsync('auth_token');
}
