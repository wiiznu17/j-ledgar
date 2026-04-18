import { API_BASE_URL } from './api-config';

/**
 * Type-safe API Client for J-Ledger Admin Web
 * 
 * ARCHITECTURE:
 * - Server Components/Actions: Fetches directly using absolute API_BASE_URL (internal)
 *   and injects authentication from cookies.
 * - Client Components: Fetches using relative paths (/api/admin/...) and relies on
 *   the infrastructure (Nginx/Next.js) to proxy requests and handle browser cookies.
 */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions extends RequestInit {
  data?: any;
  params?: Record<string, string>;
}

class ApiError extends Error {
  constructor(public status: number, public message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const isServer = typeof window === 'undefined';
  
  // 1. Resolve Auth (Server-side only)
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (isServer) {
    // Dynamically import cookies to avoid bundling server-only headers in client build
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // 2. Resolve URL
  // If it's server-side, we must use the absolute internal URL.
  // If it's client-side, we use the relative path provided.
  const baseUrl = isServer ? API_BASE_URL : '';
  
  // If the path already has a protocol, don't prepend baseUrl
  let fullPath = path.startsWith('http') ? path : `${baseUrl}${path}`;

  // 3. Append Query Params
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    fullPath += `?${searchParams.toString()}`;
  }

  // 4. Configure Fetch
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    body: options.data ? JSON.stringify(options.data) : options.body,
  };

  // 5. Execute
  const response = await fetch(fullPath, fetchOptions);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(
      response.status,
      typeof errorData === 'string' ? errorData : errorData.message || 'API Request Failed',
      errorData
    );
  }

  // If No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, data?: any, options?: RequestOptions) => request<T>(path, { ...options, method: 'POST', data }),
  put: <T>(path: string, data?: any, options?: RequestOptions) => request<T>(path, { ...options, method: 'PUT', data }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
