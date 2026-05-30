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

export interface AdminDeviceQuery
  extends Record<string, string | number | boolean | undefined> {
  page?: number;
  limit?: number;
  search?: string;
  os?: string;
  trustLevel?: string;
}

export interface AdminDeviceStats {
  total: number;
  trusted: number;
  untrusted: number;
  unknown: number;
}

export interface AdminDeviceRecord {
  id: string;
  userId: string;
  email?: string | null;
  phoneNumber?: string | null;
  deviceName?: string | null;
  deviceIdentifier: string;
  deviceType?: string | null;
  osVersion?: string | null;
  appVersion?: string | null;
  trustLevel: 'UNKNOWN' | 'TRUSTED' | 'UNTRUSTED';
  lastSeenAt?: string | null;
  createdAt: string;
  lastIp?: string | null;
  lastLocation?: string | null;
  sessionRevokedAt?: string | null;
}

export interface AdminDisputeQuery
  extends Record<string, string | number | boolean | undefined> {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
}

export interface AdminDisputeStats {
  pending: number;
  reversed: number;
  resolved: number;
  disputedAmount: number;
}

export interface AdminDisputeRecord {
  id: string;
  disputeKey: string;
  transactionId: string;
  transactionInternalId: string | number;
  transactionType: string;
  transactionStatus: string;
  type: string;
  sender: string;
  recipient: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'REVERSED' | 'RESOLVED';
  createdAt: string;
  updatedAt?: string;
  debitLeg: {
    account: string;
    type: string;
    amount: number;
    description?: string | null;
  };
  creditLeg: {
    account: string;
    type: string;
    amount: number;
    description?: string | null;
  };
  ledgerEntries?: unknown[];
}

export interface SystemApprovalQuery
  extends Record<string, string | number | boolean | undefined> {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
}

export interface SystemApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
}

export interface SystemApprovalRecord {
  id: string;
  target?: string;
  category: 'FEE' | 'LIMIT' | 'SECURITY';
  action: string;
  proposedBy: string;
  proposedAt: string;
  originalValue: string;
  proposedValue: string;
  payload?: unknown;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  notes?: string | null;
  actionedAt?: string;
}

export interface ReportAnalyticsQuery
  extends Record<string, string | number | boolean | undefined> {
  timeframe?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReportAnalyticsResponse {
  filters: {
    timeframe: string;
    startDate: string;
    endDate: string;
    label: string;
  };
  stats: {
    networkVolume: number;
    volumeGrowth: number;
    feeEarnings: number;
    totalAssets: number;
    totalLiabilities: number;
    solvencySurplus: number;
    reconciledRatio: number;
    totalTransactions: number;
    completedTransactions: number;
    failedTransactions: number;
  };
  chartData: {
    label: string;
    startDate: string;
    endDate: string;
    amount: number;
  }[];
  latestReconciliation?: {
    id?: string | number;
    status?: string;
    reportDate?: string;
    createdAt?: string;
    totalSystemAssets?: number;
    totalUserLiabilities?: number;
    discrepancy?: number;
  } | null;
}

export const adminApi = {
  // Transactions
  transactions: {
    findAll: (query: TransactionQuery) =>
      apiClient.get<PaginatedResponse<any>>('/api/admin/transactions', {
        params: query as any,
      }),
    findOne: (id: string) =>
      apiClient.get<any>(`/api/admin/transactions/${id}`),
    findLedgerEntries: (transactionId: string) =>
      apiClient.get<any>(
        `/api/admin/transactions/${transactionId}/ledger-entries`,
      ),
    getAccountTransactions: (accountId: string, query: TransactionQuery) =>
      apiClient.get<any>(`/api/admin/transactions/account/${accountId}`, {
        params: query as any,
      }),
  },

  // AML
  aml: {
    findAll: (query: any) =>
      apiClient.get<PaginatedResponse<any>>(
        '/api/admin/aml/suspicious-activities',
        {
          params: query,
        },
      ),
    findOne: (id: string) =>
      apiClient.get<any>(`/api/admin/aml/suspicious-activities/${id}`),
    updateStatus: (id: string, data: { status: string; notes?: string }) =>
      apiClient.put<any>(
        `/api/admin/aml/suspicious-activities/${id}/status`,
        data,
      ),
    reportToAMLO: (id: string, data: { reportDetails: string }) =>
      apiClient.post<any>(
        `/api/admin/aml/suspicious-activities/${id}/report`,
        data,
      ),
  },

  // Settlements
  settlements: {
    run: () => apiClient.post<any>('/api/admin/merchants/settlements/run'),
    runForPartner: (partnerId: string) =>
      apiClient.post<any>(`/api/admin/merchants/settlements/${partnerId}/run`),
    findHistory: (query: any) =>
      apiClient.get<PaginatedResponse<any>>(
        '/api/admin/merchants/settlements/history',
        { params: query },
      ),
    findPartners: (query?: any) =>
      apiClient.get<any>('/api/admin/merchants/partners', { params: query }),
  },

  // Accounts
  accounts: {
    findAll: (query: any) =>
      apiClient.get<PaginatedResponse<any>>('/api/admin/accounts', {
        params: query,
      }),
    findOne: (id: string) => apiClient.get<any>(`/api/admin/accounts/${id}`),
    updateStatus: (id: string, data: { status: string; reason?: string }) =>
      apiClient.put<any>(`/api/admin/accounts/${id}/status`, data),
    getAccountTransactions: (accountId: string, query: any) =>
      apiClient.get<any>(`/api/admin/accounts/${accountId}/transactions`, {
        params: query,
      }),
    getAccountLedgerEntries: (accountId: string) =>
      apiClient.get<any>(`/api/admin/accounts/${accountId}/ledger-entries`),
  },

  // Reconciliation
  reconciliation: {
    findAll: (query: any) =>
      apiClient.get<PaginatedResponse<any>>(
        '/api/admin/reconciliation/reports',
        { params: query },
      ),
    findOne: (id: string) =>
      apiClient.get<any>(`/api/admin/reconciliation/reports/${id}`),
    runReconciliation: () =>
      apiClient.post<any>('/api/admin/reconciliation/run'),
  },

  // Reports
  reports: {
    getAnalytics: (query: ReportAnalyticsQuery) =>
      apiClient.get<ReportAnalyticsResponse>('/api/admin/reports/analytics', {
        params: query,
      }),
  },

  // Disputes
  disputes: {
    findAll: (query: AdminDisputeQuery) =>
      apiClient.get<
        PaginatedResponse<AdminDisputeRecord> & { stats?: AdminDisputeStats }
      >('/api/admin/disputes', { params: query }),
    reverse: (id: string) =>
      apiClient.post<unknown>(`/api/admin/disputes/${id}/reverse`),
  },

  // Users
  users: {
    findAllWallet: () => apiClient.get<any[]>('/api/users/wallet'),
    findAll: () => apiClient.get<any[]>('/api/users'),
    findDevices: (query: AdminDeviceQuery) =>
      apiClient.get<
        PaginatedResponse<AdminDeviceRecord> & { stats?: AdminDeviceStats }
      >('/api/admin/users/devices', { params: query }),
    revokeDevice: (id: string) =>
      apiClient.post<unknown>(`/api/admin/users/devices/${id}/revoke`),
    reactivateDevice: (id: string) =>
      apiClient.post<unknown>(`/api/admin/users/devices/${id}/reactivate`),
    create: (data: { email: string; password: string; role: string }) =>
      apiClient.post<any>('/api/users', data),
    remove: (id: string) => apiClient.delete<any>(`/api/users/${id}`),
    freeze: (id: string) => apiClient.post<any>(`/api/users/${id}/freeze`),
  },

  // Audit
  audit: {
    findAll: (query: any) =>
      apiClient.get<PaginatedResponse<any>>('/api/admin/audit/logs', {
        params: query,
      }),
    getStats: () => apiClient.get<any>('/api/admin/audit/stats'),
  },

  // System
  system: {
    findApprovals: (query: SystemApprovalQuery) =>
      apiClient.get<
        PaginatedResponse<SystemApprovalRecord> & {
          stats?: SystemApprovalStats;
        }
      >('/api/admin/system/approvals', { params: query }),
    decideApproval: (
      id: string,
      data: { decision: 'APPROVED' | 'REJECTED'; notes?: string },
    ) =>
      apiClient.post<{ data: SystemApprovalRecord | null }>(
        `/api/admin/system/approvals/${id}/decision`,
        data,
      ),
    createApproval: (data: {
      target?: string;
      category: 'FEE' | 'LIMIT' | 'SECURITY';
      action: string;
      proposedBy?: string;
      originalValue: string;
      proposedValue: string;
      payload?: unknown;
      reason: string;
      notes?: string;
    }) =>
      apiClient.post<{ data: SystemApprovalRecord }>(
        '/api/admin/system/approvals',
        data,
      ),
  },

  // Blacklist
  blacklist: {
    findNodes: () =>
      apiClient.get<{ data: any[] }>('/api/admin/blacklist/nodes'),
    blockNode: (data: { type: 'IP' | 'HARDWARE'; target: string; reason: string; severity: string }) =>
      apiClient.post<void>('/api/admin/blacklist/nodes/block', data),
    unblockNode: (data: { type: 'IP' | 'HARDWARE'; target: string }) =>
      apiClient.post<void>('/api/admin/blacklist/nodes/unblock', data),
  },

  // Fraud Rules
  fraudRules: {
    findAll: () =>
      apiClient.get<{ data: any[] }>('/api/admin/fraud-rules'),
    findOne: (id: string) =>
      apiClient.get<{ data: any }>(`/api/admin/fraud-rules/${id}`),
    create: (data: any) =>
      apiClient.post<{ data: any }>('/api/admin/fraud-rules', data),
    update: (id: string, data: any) =>
      apiClient.put<{ data: any }>(`/api/admin/fraud-rules/${id}`, data),
    remove: (id: string) =>
      apiClient.delete<any>(`/api/admin/fraud-rules/${id}`),
  },
};
