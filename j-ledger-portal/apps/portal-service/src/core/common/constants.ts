export const REDIS_CLIENT = 'REDIS_CLIENT';

export const REDIS_KEYS = {
  ADMIN: {
    DASHBOARD_STATS: 'admin:dashboard:stats',
    APPROVAL_ITEM: (id: string) => `admin:approvals:item:${id}`,
    DISPUTE_STATUS: (id: string) => `admin:disputes:${id}:status`,
    DISPUTE_UPDATED_AT: (id: string) => `admin:disputes:${id}:updatedAt`,
  },
  BLACKLIST: {
    BLOCKED: (prefix: string, target: string) => `blacklist:${prefix}:${target}`,
    REASON: (prefix: string, target: string) => `blacklist:reason:${prefix}:${target}`,
    DATE: (prefix: string, target: string) => `blacklist:date:${prefix}:${target}`,
    BY: (prefix: string, target: string) => `blacklist:by:${prefix}:${target}`,
  },
  USER: {
    EMAIL_VERIFICATION_OTP: (userId: string) => `email_verification:otp:${userId}`,
    PIN_RESET_OTP: (userId: string) => `pin_reset:otp:${userId}`,
    PAY_TOKEN: (token: string) => `pay_token:${token}`,
  },
  MERCHANT: {
    TERMINAL_NONCE: (terminalId: string, nonce: string) => `terminal:nonce:${terminalId}:${nonce}`,
  },
} as const;
