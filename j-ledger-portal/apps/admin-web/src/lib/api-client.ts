import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import {
  API_BASE_URL,
  AUTH_COOKIE_NAME,
  PERMISSIONS_COOKIE_NAME,
} from './api-config';

/**
 * Type-safe API Client for J-Ledger Admin Web using Axios
 *
 * ARCHITECTURE:
 * - Server Components/Actions: Fetches directly using absolute API_BASE_URL (internal)
 *   and injects authentication from cookies.
 * - Client Components: Fetches using relative paths (/api/admin/...) and relies on
 *   the infrastructure (Nginx/Next.js) to proxy requests and handle browser cookies.
 */

export interface RequestOptions extends AxiosRequestConfig {
  data?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown,
    public code?: string | number,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Create axios instance
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
  });

  // Request interceptor for auth injection (server-side only) and auto-versioning
  instance.interceptors.request.use(async (config) => {
    const isServer = typeof window === 'undefined';

    // Auto Versioning: Transform '/api/...' to '/api/v1/...' if not already versioned (SERVER SIDE ONLY)
    if (isServer && config.url && config.url.startsWith('/api/') && !config.url.startsWith('/api/v1/')) {
      config.url = config.url.replace('/api/', '/api/v1/');
    }


    if (isServer) {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

      // Only inject auth header if token exists and not a public endpoint
      if (token && !config.url?.includes('/auth/login')) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  });

  // Response interceptor for error handling and standard envelope unwrapping
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Automatically unwrap the standard envelope { success, data, meta }
      if (
        response.data &&
        response.data.success === true &&
        Object.prototype.hasOwnProperty.call(response.data, 'data')
      ) {
        // Keep meta if needed
        (response as any).meta = response.data.meta;
        // Replace data with actual payload
        response.data = response.data.data;
      }
      return response;
    },
    (error: AxiosError) => {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data as any;

        if (status === 401 && !(error.config as any)?._retry) {
          (error.config as any)._retry = true;

          if (typeof window !== 'undefined') {
            window.location.href = '/login?error=Session expired';
          }
          throw new ApiError(401, 'Unauthorized', data);
        }

        let errorMessage = 'API Request Failed';
        let errorCode: string | number | undefined = undefined;
        let errorDetails: any = undefined;

        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data && typeof data === 'object') {
          if (data.success === false && data.error) {
            errorMessage = String(data.error.message || 'API Request Failed');
            errorCode = data.error.code;
            errorDetails = data.error.details;
          } else if ('message' in data) {
            errorMessage = String(data.message);
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        throw new ApiError(status, errorMessage, data, errorCode, errorDetails);
      } else if (error.request) {
        throw new ApiError(
          0,
          'Network Error - No response received',
          error.request,
        );
      } else {
        throw new ApiError(0, error.message || 'Request setup failed', error);
      }
    },
  );

  return instance;
};

const axiosInstance = createAxiosInstance();

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    axiosInstance.get<T>(path, options).then((res) => res.data),
  post: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    axiosInstance.post<T>(path, data, options).then((res) => res.data),
  put: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    axiosInstance.put<T>(path, data, options).then((res) => res.data),
  patch: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    axiosInstance.patch<T>(path, data, options).then((res) => res.data),
  delete: <T>(path: string, options?: RequestOptions) =>
    axiosInstance.delete<T>(path, options).then((res) => res.data),
};
