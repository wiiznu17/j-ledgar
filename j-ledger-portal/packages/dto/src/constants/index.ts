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
      ME: '/api/admin/auth/me',
      RESET_PASSWORD_VALIDATE: '/api/admin/auth/reset-password/validate',
      RESET_PASSWORD_CONFIRM: '/api/admin/auth/reset-password/confirm',
      ACTIVATE_VALIDATE: '/api/admin/auth/activate/validate',
      ACTIVATE_CONFIRM: '/api/admin/auth/activate/confirm',
    },
    USERS: {
      BASE: '/api/admin/users',
      WALLET: '/api/admin/users/wallet',
      WALLET_STATS: '/api/admin/users/wallet/stats',
      SECURITY_EVENTS: '/api/admin/users/security-events',
      SEARCH: '/api/admin/users/search',
      DETAIL: (id: string) => `/api/admin/users/${id}`,
      ACTIVITY: (id: string) => `/api/admin/users/${id}/activity`,
      STATUS: (id: string) => `/api/admin/users/${id}/status`,
      SUSPEND: (id: string) => `/api/admin/users/${id}/suspend`,
      UNSUSPEND: (id: string) => `/api/admin/users/${id}/unsuspend`,
      BLOCK: (id: string) => `/api/admin/users/${id}/block`,
      UNBLOCK: (id: string) => `/api/admin/users/${id}/unblock`,
    },
    ACCOUNTS: {
      BASE: '/api/admin/accounts',
      DETAIL: (id: string) => `/api/admin/accounts/${id}`,
      STATUS: (id: string) => `/api/admin/accounts/${id}/status`,
      BY_USER: (userId: string) => `/api/admin/accounts/user/${userId}`,
    },
    KYC: {
      STATS: '/api/admin/kyc/stats',
      PENDING: '/api/admin/kyc/pending',
      LIST: '/api/admin/kyc/list',
      DETAILS: (id: string) => `/api/admin/kyc/details/${id}`,
      APPROVE: (id: string) => `/api/admin/kyc/approve/${id}`,
      REJECT: (id: string) => `/api/admin/kyc/reject/${id}`,
      HISTORY: (id: string) => `/api/admin/kyc/history/${id}`,
    },
    TRANSACTIONS: {
      BASE: '/api/admin/transactions',
      DETAILS: (id: string) => `/api/admin/transactions/${id}`,
      TRANSFER: '/api/admin/transactions/transfer',
    },
    RECONCILIATION: {
      REPORTS: '/api/admin/reconciliation/reports',
      REPORT_DETAIL: (id: string) => `/api/admin/reconciliation/reports/${id}`,
      RUN: '/api/admin/reconciliation/run',
    },
    FINANCE: {
      WALLETS: '/api/admin/wallets',
      WALLET_DETAIL: (id: string) => `/api/admin/wallets/${id}`,
      WALLET_FREEZE: (userId: string) => `/api/admin/wallets/${userId}/freeze`,
      WALLET_UNFREEZE: (userId: string) => `/api/admin/wallets/${userId}/unfreeze`,
      TRANSACTIONS: '/api/admin/transactions',
      TRANSACTION_DETAIL: (id: string) => `/api/admin/transactions/${id}`,
    },
    SYSTEM: {
      OUTBOX: '/api/admin/system/outbox',
      OUTBOX_RETRY: (id: string) => `/api/admin/system/outbox/${id}/retry`,
    },
    STAFF: {
      BASE: '/api/admin/staff',
      DETAIL: (id: string) => `/api/admin/staff/${id}`,
      DEACTIVATE: (id: string) => `/api/admin/staff/${id}/deactivate`,
      REACTIVATE: (id: string) => `/api/admin/staff/${id}/reactivate`,
      RESET_PASSWORD: (id: string) => `/api/admin/staff/${id}/reset-password`,
      RESEND_INVITE: (id: string) => `/api/admin/staff/${id}/resend-invite`,
    },
    DASHBOARD: {
      STATS: '/api/admin/dashboard/stats',
    },
    ROLES: {
      BASE: '/api/admin/roles',
      DETAIL: (id: string) => `/api/admin/roles/${id}`,
      PERMISSIONS: (id: string) => `/api/admin/roles/${id}/permissions`,
    },
    PERMISSIONS: {
      BASE: '/api/admin/permissions',
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
    IDENTITY: {
      REGISTER_INIT: '/api/identity/register/init',
      REGISTER_VERIFY: '/api/identity/register/verify-otp',
      REGISTER_TERMS: '/api/identity/register/accept-terms',
      REGISTER_PROFILE: '/api/identity/register/profile',
      REGISTER_PASSWORD: '/api/identity/register/password',
      REGISTER_PIN: '/api/identity/register/pin',
      REGISTER_STATUS: '/api/identity/register/status',
      REGISTER_COMPLETE: '/api/identity/register/complete',
      LOGIN: '/api/identity/login',
      LOGOUT: '/api/identity/logout',
      LOGOUT_ALL: '/api/identity/logout-all',
      REFRESH: '/api/identity/refresh',
      PIN_SETUP: '/api/identity/pin/setup',
      PIN_VERIFY: '/api/identity/pin/verify',
      DEVICE_VERIFY: '/api/identity/device/verify',
      PROFILE: '/api/identity/profile',
      ADDRESS: (type: string) => `/api/identity/address/${type}`,
      CONSENTS: '/api/identity/consents',
      CONSENT_WITHDRAW: '/api/identity/consents/withdraw',
      DATA_EXPORT: '/api/identity/data/export',
      ACCOUNT_DELETE_REQUEST: '/api/identity/account/delete-request',
      ACCOUNT_DELETE_CONFIRM: '/api/identity/account/delete-confirm',
    },
    KYC: {
      UPLOAD: '/api/kyc/upload-id-card',
      UPLOAD_SIMPLE: '/api/kyc/upload-id-card/simple',
      CONFIRM_OCR: '/api/kyc/confirm-ocr',
      SUBMIT_SELFIE: '/api/kyc/submit-selfie',
      SUBMIT_SELFIE_SIMPLE: '/api/kyc/submit-selfie/simple',
      VERIFY_LIVENESS: '/api/kyc/verify-liveness',
      STATUS: (userId: string) => `/api/kyc/status/${userId}`,
      RETRY: '/api/kyc/retry',
    },
    NOTIFICATIONS: {
      BASE: '/api/notifications',
      MARK_READ: (id: string) => `/api/notifications/${id}/read`,
      DEVICE_TOKEN: '/api/notifications/device/token',
      PREFERENCES: '/api/notifications/preferences',
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
    BANNERS: {
      BASE: '/api/banners',
    },
    BILLING: {
      INVOICES: '/api/billing/invoices',
      INVOICE_DETAIL: (id: string) => `/api/billing/invoices/${id}`,
      PAY: (id: string) => `/api/billing/invoices/${id}/pay`,
    },
  },
  FINANCE: {
    WALLETS: {
      BASE: '/api/finance/wallets',
      CREATE: '/api/finance/wallets/create',
      GET: (userId: string) => `/api/finance/wallets/${userId}`,
      ACTIVATE: (userId: string) => `/api/finance/wallets/${userId}/activate`,
      TRANSACTIONS: (userId: string) => `/api/finance/wallets/${userId}/transactions`,
      BANK_ACCOUNTS: (userId: string) => `/api/finance/bank-accounts/${userId}`,
      TOPUP_BANK: (userId: string) => `/api/finance/wallets/${userId}/topup/bank`,
      TOPUP_CREDIT: (userId: string) => `/api/internal/wallets/${userId}/topup/credit`,
      TRANSFER_PREVIEW: (userId: string) => `/api/finance/wallets/${userId}/transfer/preview`,
      TRANSFER_PHONE: (userId: string) => `/api/finance/wallets/${userId}/transfer/phone`,
    },
  },
};

export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PIN: /^\d{6}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

export const INTERNAL_API_PATHS = {
  FINANCE: {
    ACCOUNTS: {
      BASE: '/api/v1/accounts',
      USER: (userId: string) => `/api/v1/accounts/user/${userId}`,
      STATUS: (id: string) => `/api/v1/accounts/${id}/status`,
      LEDGER_HISTORY: (id: string) => `/api/v1/ledger-entries/account/${id}`,
    },
    WALLETS: {
      BASE: '/api/finance/wallets',
      ADMIN_LIST: '/api/finance/wallets/admin/list',
      ADMIN_DETAIL: (id: string) => `/api/finance/wallets/admin/${id}`,
      GET: (userId: string) => `/api/finance/wallets/${userId}`,
      FREEZE: (userId: string) => `/api/finance/wallets/${userId}/freeze`,
      UNFREEZE: (userId: string) => `/api/finance/wallets/${userId}/unfreeze`,
      TRANSACTIONS: (userId: string) => `/api/finance/wallets/${userId}/transactions`,
      TRANSACTION_DETAIL: (id: string) => `/api/finance/wallets/transactions/${id}`,
    },
    TRANSACTIONS: {
      BASE: '/api/v1/transactions',
      DETAIL: (id: string) => `/api/v1/transactions/${id}`,
    },
    AML: {
      SUSPICIOUS_ACTIVITIES: '/api/v1/aml/suspicious-activities',
      SUSPICIOUS_ACTIVITY_STATUS: (id: string) => `/api/v1/aml/suspicious-activities/${id}/status`,
      REPORT_AMLO: '/api/v1/aml/report-to-amlo',
    },
    SYSTEM: {
      RECONCILE: {
        REPORTS: '/api/v1/system/reconcile/reports',
        DETAIL: (id: string) => `/api/v1/system/reconcile/reports/${id}`,
        TRIGGER: '/api/v1/system/reconcile/trigger',
      },
      OUTBOX: {
        BASE: '/api/v1/system/outbox',
        RETRY: (id: string) => `/api/v1/system/outbox/${id}/retry`,
      },
    },
  },
};
