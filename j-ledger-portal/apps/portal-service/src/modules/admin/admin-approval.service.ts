import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { FinanceService } from '../../core/finance/finance.service';
import { KafkaProducerService } from '../notification/kafka-producer.service';
import { ApprovalRequestStatus, ApprovalRequestType } from '@prisma/client';
import { KafkaTopic } from '@repo/dto';
import { PaginationUtility } from '../../common/utils/pagination.util';

@Injectable()
export class AdminApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async getApprovals(
    page: number = 1,
    limit: number = 10,
    search?: string,
    status?: string,
    category?: string,
  ) {
    const normalizedStatus =
      status && status !== 'ALL' ? (status as ApprovalRequestStatus) : undefined;
    const searchTerm = search?.trim().toLowerCase();

    const where: any = {
      ...(normalizedStatus && { status: normalizedStatus }),
    };

    if (searchTerm) {
      where.OR = [
        { id: { contains: searchTerm, mode: 'insensitive' } },
        { notes: { contains: searchTerm, mode: 'insensitive' } },
        { requestedBy: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const result = await PaginationUtility.paginate(
      (opts) =>
        this.prisma.approvalRequest.findMany({
          where,
          ...opts,
        }),
      () => this.prisma.approvalRequest.count({ where }),
      {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    );

    const stats = await this.prisma.approvalRequest.groupBy({
      by: ['status'],
      _count: true,
    });

    const statsMap = {
      pending: stats.find((s) => s.status === 'PENDING')?._count || 0,
      approved: stats.find((s) => s.status === 'APPROVED')?._count || 0,
      rejected: stats.find((s) => s.status === 'REJECTED')?._count || 0,
    };

    // Map DB model to UI expectations
    const data = result.data.map((row) => ({
      ...row,
      target: (row.requestData as any)?.target || 'SYSTEM_SETTINGS',
      category: (row.requestData as any)?.category || 'SECURITY',
      action: (row.requestData as any)?.action || row.requestType,
      proposedBy: row.requestedBy,
      proposedAt: row.createdAt.toISOString(),
      originalValue: (row.requestData as any)?.originalValue || 'N/A',
      proposedValue: (row.requestData as any)?.proposedValue || 'N/A',
      payload: (row.requestData as any)?.payload || null,
      reason:
        (row.requestData as any)?.reason || row.notes || 'No reason provided',
    }));

    return {
      ...result,
      data,
      stats: statsMap,
    };
  }

  async createApproval(body: any) {
    const requestType = this.mapActionToType(body.action);

    const record = await this.prisma.approvalRequest.create({
      data: {
        requestType,
        requestedBy: body.proposedBy || 'Admin Operator',
        status: ApprovalRequestStatus.PENDING,
        notes: body.reason || null,
        requestData: {
          target: body.target || 'SYSTEM_SETTINGS',
          category: body.category || 'SECURITY',
          action: body.action || 'System Change Request',
          originalValue: body.originalValue || 'N/A',
          proposedValue: body.proposedValue || 'N/A',
          payload: body.payload || null,
          reason: body.reason || 'No reason provided',
        },
      },
    });

    return { data: record };
  }

  async decideApproval(
    id: string,
    body: { decision: 'APPROVED' | 'REJECTED'; notes?: string },
  ) {
    const current = await this.prisma.approvalRequest.findUnique({
      where: { id },
    });

    if (!current) {
      return { data: null };
    }

    if (body.decision === 'APPROVED') {
      const requestData = current.requestData as any;
      if (requestData.target === 'SYSTEM_SETTINGS' && requestData.payload) {
        await this.financeService.updateSystemSettings(requestData.payload);
      } else if (
        requestData.action === 'EXPORT_STATEMENT' &&
        requestData.payload
      ) {
        const { userId, year, month, email } = requestData.payload;

        // Fetch transactions for the statement period
        const txs = await this.financeService.getTransactions(userId, {
          page: 0,
          size: 100,
        });

        // Filter transactions by month/year if possible
        const filteredTxs = txs.filter((t: any) => {
          if (!t.createdAt) return false;
          const d = new Date(t.createdAt);
          return (
            d.getFullYear() === Number(year) && d.getMonth() + 1 === Number(month)
          );
        });

        // Format a beautiful text listing of transactions
        let txText = '';
        if (filteredTxs.length === 0) {
          txText = 'No transactions found for this period.';
        } else {
          txText = filteredTxs
            .map((t: any) => {
              const date = new Date(t.createdAt).toLocaleDateString();
              const type = t.type || 'TRANSFER';
              const amount = t.amount ? t.amount.toFixed(2) : '0.00';
              const direction = t.direction || 'OUT';
              const note = t.note ? ` (${t.note})` : '';
              return `${date} | ${type} | ${direction} | ${amount} THB${note}`;
            })
            .join('\n');
        }

        // Generate mock PDF attachment
        const content = `User ID: ${userId}\nStatement Period: ${month}/${year}\n\nTransactions:\n---------------------------------\n${txText}`;

        // We will emit the security event, and the notification-worker will send the email with this statement content!
        await this.kafkaProducer.emit(KafkaTopic.SECURITY_EVENTS, {
          userId,
          eventType: 'STATEMENT_EXPORT_READY',
          metadata: {
            email,
            year,
            month,
            statementText: content,
          },
        });
      }
    }

    const updated = await this.prisma.approvalRequest.update({
      where: { id },
      data: {
        status: body.decision as ApprovalRequestStatus,
        notes: body.notes || 'Actioned by Admin Checker',
        approvedBy: 'Admin Checker', // This should come from req.user.sub in a real app
      },
    });

    return { data: updated };
  }

  private mapActionToType(action: string): ApprovalRequestType {
    if (action === 'EXPORT_STATEMENT')
      return ApprovalRequestType.MANUAL_ADJUSTMENT; // Closest type
    if (action?.includes('LIMIT')) return ApprovalRequestType.LIMIT_UPDATE;
    if (action?.includes('PARTNER')) return ApprovalRequestType.PARTNER_APPROVAL;
    if (action?.includes('FEE')) return ApprovalRequestType.FEE_UPDATE;
    return ApprovalRequestType.MANUAL_ADJUSTMENT;
  }
}
