// src/types/user.ts
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

// src/types/account.ts
export interface Account {
  id: string;
  userId: string;
  accountName: string;
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'FROZEN';
  createdAt?: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  createdAt: string;
  account?: {
    id: string;
    accountName: string;
  };
}

// src/types/transaction.ts
export interface Transaction {
  id: string;
  transactionType: 'TOPUP' | 'TRANSFER' | 'WITHDRAW';
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  createdAt: string;
  description?: string;
  senderId?: string;
  receiverId?: string;
}

export interface TransactionDetailsDto {
  transaction: Transaction;
  ledgerEntries: LedgerEntry[];
}
