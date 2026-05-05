import {
  TransactionType,
  TransactionStatus,
  AccountStatus,
  LedgerEntryType,
  ReconciliationStatus,
  AdminRole,
  AuditAction,
  ResourceType,
  SuspiciousActivityStatus,
} from '../enums';

export interface WalletUser {
  id: string;
  phoneNumber: string;
  email: string | null;
  status: string; // UserStatus enum
  registrationState: string; // RegistrationState enum
  ledgerAccountId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: AdminRole;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface Account {
  id: string;
  userId: string;
  accountName: string;
  balance: number;
  currency: string;
  status: AccountStatus;
  createdAt?: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  entryType: LedgerEntryType;
  amount: number;
  createdAt: string;
  account?: {
    id: string;
    accountName: string;
  };
  transaction?: Transaction;
}

export interface Transaction {
  id: string;
  transactionType: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  createdAt: string;
  description?: string;
  senderId?: string;
  receiverId?: string;
}

export interface TransactionDetailsDto {
  transaction: Transaction;
  ledgerEntries: LedgerEntry[];
}

export interface ReconciliationReport {
  id: string;
  reportDate: string;
  totalSystemAssets: number;
  totalUserLiabilities: number;
  discrepancy: number;
  status: ReconciliationStatus;
  createdAt: string;
}

export interface ReconciliationSummary {
  totalAccountBalances: number;
  totalTransactionsCount: number;
  status: ReconciliationStatus;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Admin-specific types
export interface AuditLog {
  id: string;
  adminUserId: string | null;
  userId: string | null;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestPayload?: Record<string, any>;
  responseStatus: number | null;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  reason?: string | null;
  createdAt: Date | string;
}

export interface SuspiciousActivity {
  id: string;
  userId: string;
  activityType: string;
  description: string;
  riskScore: number;
  status: SuspiciousActivityStatus;
  createdAt: string;
  notes?: string;
}

export interface AdminPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WalletDto {
  id: number;
  userId: string;
  walletId: string;
  balance: number;
  currency: string;
  status: string;
  dailyLimit: number;
  monthlyLimit: number;
  createdAt: string;
  updatedAt: string;
}
