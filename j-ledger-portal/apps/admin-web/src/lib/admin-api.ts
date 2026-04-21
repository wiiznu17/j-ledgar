import { apiClient } from './api-client';

// Transaction Monitoring
export interface TransactionQuery {
  page?: number;
  limit?: number;
  fromAccountId?: string;
  toAccountId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const adminApi = {
  // Transactions
  transactions: {
    findAll: (query: TransactionQuery) =>
      apiClient.get<PaginatedResponse<any>>('/admin/transactions', { params: query as any }),
    findOne: (id: string) =>
      apiClient.get<any>(`/admin/transactions/${id}`),
    findLedgerEntries: (transactionId: string) =>
      apiClient.get<any>(`/admin/transactions/${transactionId}/ledger-entries`),
    getAccountTransactions: (accountId: string, query: TransactionQuery) =>
      apiClient.get<any>(`/admin/transactions/account/${accountId}`, { params: query as any }),
  },

  // AML
  aml: {
    findAll: (query: any) =>
      apiClient.get<PaginatedResponse<any>>('/admin/aml/suspicious-activities', { params: query }),
    findOne: (id: string) =>
      apiClient.get<any>(`/admin/aml/suspicious-activities/${id}`),
    updateStatus: (id: string, data: { status: string; notes?: string }) =>
      apiClient.put<any>(`/admin/aml/suspicious-activities/${id}/status`, data),
    reportToAMLO: (id: string, data: { reportDetails: string }) =>
      apiClient.post<any>(`/admin/aml/suspicious-activities/${id}/report`, data),
  },

  // Accounts
  accounts: {
    findAll: (query: any) =>
      apiClient.get<PaginatedResponse<any>>('/admin/accounts', { params: query }),
    findOne: (id: string) =>
      apiClient.get<any>(`/admin/accounts/${id}`),
    updateStatus: (id: string, data: { status: string; reason?: string }) =>
      apiClient.put<any>(`/admin/accounts/${id}/status`, data),
    getAccountTransactions: (accountId: string, query: any) =>
      apiClient.get<any>(`/admin/accounts/${accountId}/transactions`, { params: query }),
    getAccountLedgerEntries: (accountId: string) =>
      apiClient.get<any>(`/admin/accounts/${accountId}/ledger-entries`),
  },

  // Reconciliation
  reconciliation: {
    findAll: (query: any) =>
      apiClient.get<PaginatedResponse<any>>('/admin/reconciliation/reports', { params: query }),
    findOne: (id: string) =>
      apiClient.get<any>(`/admin/reconciliation/reports/${id}`),
    runReconciliation: () =>
      apiClient.post<any>('/admin/reconciliation/run'),
  },

  // Users
  users: {
    findAllWallet: () =>
      apiClient.get<any[]>('/users/wallet'),
    findAll: () =>
      apiClient.get<any[]>('/users'),
    create: (data: { email: string; password: string; role: string }) =>
      apiClient.post<any>('/users', data),
    remove: (id: string) =>
      apiClient.delete<any>(`/users/${id}`),
    freeze: (id: string) =>
      apiClient.post<any>(`/users/${id}/freeze`),
  },

  // Audit
  audit: {
    findAll: (query: any) =>
      apiClient.get<PaginatedResponse<any>>('/admin/audit/logs', { params: query }),
  },
};
