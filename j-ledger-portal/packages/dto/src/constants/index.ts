/**
 * System-wide Constants & Validation Patterns
 *
 * New Hybrid Modular Architecture:
 * - Admin endpoints: /api/admin/* (portal-service)
 * - Customer auth: /api/auth/* (portal-service)
 * - Customer KYC: /api/kyc/* (portal-service)
 * - Finance: /api/finance/* (finance-service)
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
      SECURITY_EVENTS: '/api/admin/users/security-events',
      SUSPEND: (id: string) => `/api/admin/users/${id}/suspend`,
      UNSUSPEND: (id: string) => `/api/admin/users/${id}/unsuspend`,
      BLOCK: (id: string) => `/api/admin/users/${id}/block`,
      UNBLOCK: (id: string) => `/api/admin/users/${id}/unblock`,
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
    RECONCILIATION: {
      REPORTS: '/api/admin/reconciliation/reports',
      RUN: '/api/admin/reconciliation/run',
    },
    SYSTEM: {
      RECONCILE_REPORTS: '/api/admin/reconciliation/reports',
      RECONCILE_TRIGGER: '/api/admin/reconciliation/run',
      OUTBOX: '/api/admin/system/outbox',
    },
    PROMOTIONS: {
      DEALS: '/api/admin/deals',
      BANNERS: '/api/admin/banners',
      REDEMPTIONS: '/api/admin/deals/redemptions',
      DEAL_DETAIL: (id: string) => `/api/admin/deals/${id}`,
      BANNER_DETAIL: (id: string) => `/api/admin/banners/${id}`,
      BRANDS: '/api/admin/deals/meta/brands',
      CATEGORIES: '/api/admin/deals/meta/categories',
      UPLOAD: '/api/admin/common/upload',
    },
  },
  PORTAL: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      PIN_SETUP: '/api/auth/pin/setup',
      DEVICE_BIND: '/api/auth/device/bind',
      VERIFY_PIN: '/api/auth/verify-pin',
    },
    KYC: {
      UPLOAD: '/api/kyc/upload',
      STATUS: '/api/kyc/status',
    },
    LOYALTY: {
      BALANCE: '/api/loyalty/balance',
      HISTORY: '/api/loyalty/history',
    },
    DEALS: {
      BASE: '/api/deals',
      CATEGORIES: '/api/deals/categories',
      MY_REDEMPTIONS: '/api/deals/my-redemptions',
      DETAIL: (id: string) => `/api/deals/${id}`,
      REDEEM: (id: string) => `/api/deals/${id}/redeem`,
      REDEMPTION_DETAIL: (id: string) => `/api/deals/redemptions/${id}`,
      REDEMPTION_USE: (id: string) => `/api/deals/redemptions/${id}/use`,
    },
  },
  FINANCE: {
    WALLETS: {
      BASE: '/api/finance/wallets',
      CREATE: '/api/finance/wallets/create',
      GET: (userId: string) => `/api/finance/wallets/${userId}`,
      LIMITS: (userId: string) => `/api/finance/wallets/${userId}/limits`,
      ACTIVATE: (userId: string) => `/api/finance/wallets/${userId}/activate`,
      DEACTIVATE: (userId: string) => `/api/finance/wallets/${userId}/deactivate`,
      FREEZE: (userId: string) => `/api/finance/wallets/${userId}/freeze`,
      UNFREEZE: (userId: string) => `/api/finance/wallets/${userId}/unfreeze`,
      TOPUP_BANK: (userId: string) => `/api/finance/wallets/${userId}/topup/bank`,
      TOPUP_COUNTER: (userId: string) => `/api/finance/wallets/${userId}/topup/counter`,
      TOPUP_CASH: (userId: string) => `/api/finance/wallets/${userId}/topup/cash`,
      TOPUP_HISTORY: (userId: string) => `/api/finance/wallets/${userId}/topup-history`,
      QR_GENERATE: (userId: string) => `/api/finance/wallets/${userId}/qr/generate`,
      QR_PAY: (userId: string) => `/api/finance/wallets/${userId}/qr/pay`,
      QR_STATIC: (userId: string) => `/api/finance/wallets/${userId}/qr/static`,
      QR_HISTORY: (userId: string) => `/api/finance/wallets/${userId}/qr/history`,
    },
    ADMIN: {
      LIST: '/api/finance/wallets/admin/list',
      GET: (id: string) => `/api/finance/wallets/admin/${id}`,
      ADJUST: (id: string) => `/api/finance/wallets/admin/${id}/adjust`,
      DEACTIVATE: (id: string) => `/api/finance/wallets/admin/${id}/deactivate`,
      ACTIVATE: (id: string) => `/api/finance/wallets/admin/${id}/activate`,
      UPDATE_LIMITS: (id: string) => `/api/finance/wallets/admin/${id}/limits`,
    },
  },
};

export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PIN: /^\d{6}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};
