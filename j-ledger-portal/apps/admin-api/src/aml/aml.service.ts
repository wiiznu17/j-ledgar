import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';

export interface AMLQuery {
  page?: number;
  limit?: number;
  userId?: string;
  status?: string;
  activityType?: string;
  riskScoreMin?: number;
  startDate?: string;
  endDate?: string;
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

export interface UpdateStatusDto {
  status: string;
  notes?: string;
}

export interface ReportToAMLDDto {
  reportDetails: string;
}

@Injectable()
export class AMLService {
  constructor(private proxyService: LedgerProxyService) {}

  async findAll(query: AMLQuery): Promise<PaginatedResponse<any>> {
    const page = query.page || 1;
    const limit = query.limit || 50;

    const params: Record<string, string> = {
      page: page.toString(),
      limit: limit.toString(),
    };

    if (query.userId) params.userId = query.userId;
    if (query.status) params.status = query.status;
    if (query.activityType) params.activityType = query.activityType;
    if (query.riskScoreMin) params.riskScoreMin = query.riskScoreMin.toString();
    if (query.startDate) params.startDate = query.startDate;
    if (query.endDate) params.endDate = query.endDate;

    return this.proxyService.forwardToGateway<any>(
      'get',
      '/api/v1/aml/suspicious-activities',
      params,
    );
  }

  async findOne(id: string) {
    return this.proxyService.forwardToGateway<any>(
      'get',
      `/api/v1/aml/suspicious-activities/${id}`,
    );
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    return this.proxyService.forwardToGateway<any>(
      'put',
      `/api/v1/aml/suspicious-activities/${id}/status`,
      dto,
    );
  }

  async reportToAMLO(id: string, dto: ReportToAMLDDto) {
    return this.proxyService.forwardToGateway<any>(
      'post',
      `/api/v1/aml/suspicious-activities/${id}/report`,
      dto,
    );
  }
}
