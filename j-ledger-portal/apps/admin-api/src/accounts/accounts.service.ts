import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';

export interface AccountQuery {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  currency?: string;
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

export interface UpdateAccountStatusDto {
  status: string;
  reason?: string;
}

@Injectable()
export class AccountsService {
  constructor(private proxyService: LedgerProxyService) {}

  async findAll(query: AccountQuery): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 50;

    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };

    if (query.userId) params.userId = query.userId;
    if (query.status) params.status = query.status;
    if (query.currency) params.currency = query.currency;

    return this.proxyService.forwardToGateway<any>(
      'get',
      '/api/v1/accounts',
      params,
    );
  }

  async findOne(id: string) {
    return this.proxyService.forwardToGateway<any>(
      'get',
      `/api/v1/accounts/${id}`,
    );
  }

  async updateStatus(id: string, dto: UpdateAccountStatusDto) {
    return this.proxyService.forwardToGateway<any>(
      'put',
      `/api/v1/accounts/${id}/status`,
      dto,
    );
  }

  async getAccountTransactions(accountId: string, query: any) {
    const page = query.page || 1;
    const limit = query.limit || 50;

    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };

    if (query.status) params.status = query.status;
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;

    return this.proxyService.forwardToGateway<any>(
      'get',
      `/api/v1/accounts/${accountId}/transactions`,
      params,
    );
  }

  async getAccountLedgerEntries(accountId: string) {
    return this.proxyService.forwardToGateway<any>(
      'get',
      `/api/v1/accounts/${accountId}/ledger-entries`,
    );
  }
}
