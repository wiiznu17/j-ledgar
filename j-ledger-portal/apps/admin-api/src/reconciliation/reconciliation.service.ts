import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';

export interface ReconciliationQuery {
  page?: number;
  limit?: number;
  reportDate?: string;
  status?: string;
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
export class ReconciliationService {
  constructor(private proxyService: LedgerProxyService) {}

  async findAll(query: ReconciliationQuery): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 50;

    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };

    if (query.reportDate) params.reportDate = query.reportDate;
    if (query.status) params.status = query.status;

    return this.proxyService.forwardToGateway<any>(
      'get',
      '/api/v1/system/reconciliation/reports',
      params,
    );
  }

  async findOne(id: string) {
    return this.proxyService.forwardToGateway<any>(
      'get',
      `/api/v1/system/reconciliation/reports/${id}`,
    );
  }

  async runReconciliation() {
    return this.proxyService.forwardToGateway<any>(
      'post',
      '/api/v1/system/reconcile',
    );
  }
}
