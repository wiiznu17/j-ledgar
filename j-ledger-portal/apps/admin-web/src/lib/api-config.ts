/**
 * API Configuration for J-Ledger Admin Portal
 *
 * In a Two-Tier Gateway architecture:
 * - Server-side (SSR/Actions): Should use the internal Docker DNS (e.g., http://api-gateway:8080)
 * - Client-side (Browser): Should use relative paths (/api/...) to go through Nginx
 */

export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side (SSR): Use the internal gateway URL (e.g., http://api-gateway:8080)
    // This allows the container to talk to the gateway directly within the Docker network
    return process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://api-gateway:8080';
  }
  // Client-side (Browser): Use relative path.
  // When running on production, Nginx will proxy /api to the admin-api (BFF).
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
