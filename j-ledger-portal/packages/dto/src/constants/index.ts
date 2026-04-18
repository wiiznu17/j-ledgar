/**
 * System-wide Constants & Validation Patterns
 */

export const API_PATHS = {
  ADMIN: {
    AUTH: {
      LOGIN: '/api/admin/auth/login',
      LOGOUT: '/api/admin/auth/logout',
      REFRESH: '/api/admin/auth/refresh',
    },
    USERS: {
      BASE: '/api/admin/users',
      WALLET: '/api/admin/users/wallet',
      FREEZE: (id: string) => `/api/admin/users/${id}/freeze`,
    },
    ACCOUNTS: {
      BASE: '/api/admin/accounts',
      STATUS: (id: string) => `/api/admin/accounts/${id}/status`,
    },
    TRANSACTIONS: {
      BASE: '/api/admin/transactions',
      DETAILS: (id: string) => `/api/admin/transactions/${id}`,
      TRANSFER: '/api/admin/transactions/transfer',
    },
    SYSTEM: {
      RECONCILE_REPORTS: '/api/admin/system/reconcile/reports',
      RECONCILE_TRIGGER: '/api/admin/system/reconcile/trigger',
    },
  },
  WALLET_API: {
    AUTH: {
      LOGIN: '/auth/login',
      PIN_SETUP: '/auth/pin/setup',
      DEVICE_BIND: '/auth/device/bind',
      VERIFY_PIN: '/auth/verify-pin',
    },
    PAYMENT: {
      TOPUP: '/payment/topup',
    },
    MERCHANT: {
      SCAN_PAY: '/merchant/scan-pay',
    },
  },
};

export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PIN: /^\d{6}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};
