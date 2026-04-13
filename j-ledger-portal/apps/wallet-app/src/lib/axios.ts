import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const getBaseUrl = () => {
  if (__DEV__) {
    // For local development
    if (Platform.OS === "android") {
      return "http://10.0.2.2/api"; // Android Emulator points to localhost of host machine
    }
    return "http://localhost/api"; // iOS and Web
  }
  return process.env.EXPO_PUBLIC_API_URL || "https://api.jledger.io/api";
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Potential logic for auto-logout or token refresh could go here
      await SecureStore.deleteItemAsync("auth_token");
    }
    return Promise.reject(error);
  }
);

export default api;
