export enum TransactionType {
  TOPUP = 'TOPUP',
  TRANSFER = 'TRANSFER',
  WITHDRAW = 'WITHDRAW',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  RECONCILER = 'RECONCILER',
  SUPPORT_STAFF = 'SUPPORT_STAFF',
  INTERNAL = 'INTERNAL',
  USER = 'USER',
}

export enum LedgerEntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum ReconciliationStatus {
  MATCHED = 'MATCHED',
  DISCREPANCY = 'DISCREPANCY',
  STABLE = 'STABLE',
  FIX_REQUIRED = 'FIX_REQUIRED',
}
