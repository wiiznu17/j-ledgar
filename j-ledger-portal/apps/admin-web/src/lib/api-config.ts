/**
 * API Configuration for J-Ledger Admin Portal
 *
 * In a Two-Tier Gateway architecture:
 * - Server-side (SSR/Actions): Should use the internal Docker DNS (e.g., http://api-gateway:8080)
 * - Client-side (Browser): Should use relative paths (/api/...) to go through Nginx
 */

export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side: Use the internal gateway URL
    return process.env.API_GATEWAY_URL || 'http://api-gateway:8080';
  }
  // Client-side: Use relative path (Nginx will proxy /api to the gateway)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();
