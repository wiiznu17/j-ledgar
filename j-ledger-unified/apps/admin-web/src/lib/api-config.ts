/**
 * API Configuration for J-Ledger Admin Portal
 *
 * In a Two-Tier Gateway architecture:
 * - Server-side (SSR/Actions): Should use the internal Docker DNS (e.g., http://api-gateway:8080)
 * - Client-side (Browser): Should use relative paths (/api/...) to go through Nginx
 */

export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side (SSR): Use internal URL, fallback to localhost in dev or admin-api in prod
    return process.env.INTERNAL_API_URL || 
           (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'http://admin-api:3001');
  }
  // Client-side (Browser): Use relative path.
  // When running on production, Nginx will proxy /api to the admin-api (BFF).
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
