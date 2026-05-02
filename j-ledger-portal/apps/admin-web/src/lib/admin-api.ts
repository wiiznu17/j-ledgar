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
      apiClient.get<PaginatedResponse<any>>('/api/admin/transactions', { params: query as any }),
    findOne: (id: string) => apiClient.get<any>(`/api/admin/transactions/${id}`),
    findLedgerEntries: (transactionId: string) =>
      apiClient.get<any>(`/api/admin/transactions/${transactionId}/ledger-entries`),
    getAccountTransactions: (accountId: string, query: TransactionQuery) =>
      apiClient.get<any>(`/api/admin/transactions/account/${accountId}`, { params: query as any }),
  },

  // AML
  aml: {
    findAll: (query: any) =>
      apiClient.get<PaginatedResponse<any>>('/api/admin/aml/suspicious-activities', { params: query }),
    findOne: (id: string) => apiClient.get<any>(`/api/admin/aml/suspicious-activities/${id}`),
    updateStatus: (id: string, data: { status: string; notes?: string }) =>
      apiClient.put<any>(`/api/admin/aml/suspicious-activities/${id}/status`, data),
    reportToAMLO: (id: string, data: { reportDetails: string }) =>
      apiClient.post<any>(`/api/admin/aml/suspicious-activities/${id}/report`, data),
  },

  // Accounts
  accounts: {
    findAll: (query: any) =>
      apiClient.get<PaginatedResponse<any>>('/api/admin/accounts', { params: query }),
    findOne: (id: string) => apiClient.get<any>(`/api/admin/accounts/${id}`),
    updateStatus: (id: string, data: { status: string; reason?: string }) =>
      apiClient.put<any>(`/api/admin/accounts/${id}/status`, data),
    getAccountTransactions: (accountId: string, query: any) =>
      apiClient.get<any>(`/api/admin/accounts/${accountId}/transactions`, { params: query }),
    getAccountLedgerEntries: (accountId: string) =>
      apiClient.get<any>(`/api/admin/accounts/${accountId}/ledger-entries`),
  },

  // Reconciliation
  reconciliation: {
    findAll: (query: any) =>
      apiClient.get<PaginatedResponse<any>>('/api/admin/reconciliation/reports', { params: query }),
    findOne: (id: string) => apiClient.get<any>(`/api/admin/reconciliation/reports/${id}`),
    runReconciliation: () => apiClient.post<any>('/api/admin/reconciliation/run'),
  },

  // Users
  users: {
    findAllWallet: () => apiClient.get<any[]>('/api/users/wallet'),
    findAll: () => apiClient.get<any[]>('/api/users'),
    create: (data: { email: string; password: string; role: string }) =>
      apiClient.post<any>('/api/users', data),
    remove: (id: string) => apiClient.delete<any>(`/api/users/${id}`),
    freeze: (id: string) => apiClient.post<any>(`/api/users/${id}/freeze`),
  },

  // Audit
  audit: {
    findAll: (query: any) =>
      apiClient.get<PaginatedResponse<any>>('/api/admin/audit/logs', { params: query }),
  },
};
