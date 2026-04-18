import { TransactionType, TransactionStatus, AccountStatus, LedgerEntryType, ReconciliationStatus } from '../enums';

export interface WalletUser {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
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
