/**
 * API Configuration for J-Ledger Admin Portal
 *
 * In the new hybrid modular architecture:
 * - Server-side (SSR/Actions): Should use the internal Docker DNS (portal-service:3000)
 * - Client-side (Browser): Should use relative paths (/api/...) to go through Nginx
 */

export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    // Server-side (SSR): Use internal URL, fallback to localhost in dev or portal-service in prod
    return (
      process.env.INTERNAL_API_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'http://portal-service:3000')
    );
  }
  // Client-side (Browser): Use relative path.
  // When running on production, Nginx will proxy /api to the portal-service (BFF).
  return '';
};


export const API_BASE_URL = getApiBaseUrl();

// Cookie Names
export const AUTH_COOKIE_NAME = 'admin_session';
export const REFRESH_TOKEN_COOKIE_NAME = 'admin_refresh_token';
export const PERMISSIONS_COOKIE_NAME = 'user_permissions';
