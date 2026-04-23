import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';

export interface TransactionQuery {
  page?: number;
  limit?: number;
  fromAccountId?: string;
  toAccountId?: string;
  status?: string;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

@Injectable()
export class TransactionsService {
  constructor(private proxyService: LedgerProxyService) {}

  async findAll(query: TransactionQuery): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 50;

    // Build query params for j-ledger-core
    const params: Record<string, string> = {};
    if (query.fromAccountId) params.fromAccountId = query.fromAccountId;
    if (query.toAccountId) params.toAccountId = query.toAccountId;
    if (query.status) params.status = query.status;
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;
    if (query.minAmount) params.minAmount = query.minAmount.toString();
    if (query.maxAmount) params.maxAmount = query.maxAmount.toString();
    params.page = page.toString();
    params.limit = limit.toString();

    // Forward to j-ledger-core
    const response = await this.proxyService.forwardToGateway<any>(
      'get',
      '/api/v1/transactions',
      params,
    );

    return response;
  }

  async findOne(id: string) {
    return this.proxyService.forwardToGateway<any>('get', `/api/v1/transactions/${id}`);
  }

  async findLedgerEntries(transactionId: string) {
    return this.proxyService.forwardToGateway<any>(
      'get',
      `/api/v1/transactions/${transactionId}/ledger-entries`,
    );
  }

  async getAccountTransactions(accountId: string, query: TransactionQuery) {
    const page = query.page || 1;
    const limit = query.limit || 50;

    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };

    if (query.status) params.status = query.status;
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;
    if (query.minAmount) params.minAmount = query.minAmount.toString();
    if (query.maxAmount) params.maxAmount = query.maxAmount.toString();

    return this.proxyService.forwardToGateway<any>(
      'get',
      `/api/v1/accounts/${accountId}/transactions`,
      params,
    );
  }

  async search(query: TransactionQuery): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 50;

    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };

    if (query.fromAccountId) params.accountId = query.fromAccountId;
    if (query.status) params.status = query.status;
    if (query.transactionType) params.transactionType = query.transactionType;
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;
    if (query.minAmount) params.minAmount = query.minAmount.toString();
    if (query.maxAmount) params.maxAmount = query.maxAmount.toString();

    return this.proxyService.forwardToGateway<any>('get', '/api/v1/transactions/search', params);
  }

  async flagTransaction(id: string, reason: string) {
    return this.proxyService.forwardToGateway<any>('post', `/api/v1/transactions/${id}/flag`, {
      reason,
    });
  }
}
