import {
  Controller,
  Post,
  Get,
  Put,
  UseGuards,
  Query,
  Param,
  Body,
  Inject,
} from '@nestjs/common';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminPermissionsGuard } from '../guards/admin-permissions.guard';
import { ReportingService } from '../../modules/reporting/reporting.service';
import { FinanceService } from '../../modules/integration/finance.service';
import { AdminPaginatedResponse, Permission, KafkaTopic } from '@repo/dto';
import { Permissions as RequirePermissions } from '../decorators/permissions.decorator';
import { AuditLog } from '../decorators/audit.decorator';
import { ResourceType } from '../../modules/audit/audit.service';
import { REDIS_CLIENT } from '../../core/common/constants';
import Redis from 'ioredis';
import { KafkaProducerService } from '../../modules/notification/kafka-producer.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ApprovalRequestStatus, ApprovalRequestType } from '@prisma/client';

@Controller('admin/system')
@UseGuards(AdminJwtGuard, AdminRolesGuard, AdminPermissionsGuard)
export class AdminSystemController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly financeService: FinanceService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly kafkaProducer: KafkaProducerService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('settings')
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  async getSettings() {
    return this.financeService.getSystemSettings();
  }

  @Put('settings')
  @RequirePermissions(Permission.MANAGE_SYSTEM_SETTINGS)
  @AuditLog(
    null as any,
    ResourceType.SYSTEM_SETTINGS,
    'Updated system settings',
  )
  async updateSettings(@Body() body: any) {
    return this.financeService.updateSystemSettings(body);
  }

  @Get('fees')
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  async getFees() {
    return this.financeService.getFeeConfiguration();
  }

  @Put('fees')
  @RequirePermissions(Permission.MANAGE_SYSTEM_SETTINGS)
  @AuditLog(
    null as any,
    ResourceType.SYSTEM_SETTINGS,
    'Updated fee configuration',
  )
  async updateFees(@Body() body: any) {
    return this.financeService.updateFeeConfiguration(body);
  }

  @Get('approvals')
  @RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
  async getApprovals(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
  ): Promise<AdminPaginatedResponse<any> & { stats: any }> {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(Math.max(1, Number(limit) || 10), 100);
    const skip = (safePage - 1) * safeLimit;

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

    const [rows, total] = await Promise.all([
      this.prisma.approvalRequest.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.approvalRequest.count({ where }),
    ]);

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
    const data = rows.map((row) => ({
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
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
      stats: statsMap,
    };
  }

  @Post('approvals')
  @RequirePermissions(Permission.MANAGE_SYSTEM_SETTINGS)
  @AuditLog(
    null as any,
    ResourceType.SYSTEM_SETTINGS,
    'Created system approval request',
  )
  async createApproval(@Body() body: any) {
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

  @Post('approvals/:id/decision')
  @RequirePermissions(Permission.MANAGE_SYSTEM_SETTINGS)
  @AuditLog(
    null as any,
    ResourceType.SYSTEM_SETTINGS,
    'Actioned system approval request',
  )
  async decideApproval(
    @Param('id') id: string,
    @Body() body: { decision: 'APPROVED' | 'REJECTED'; notes?: string },
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

  @Get('outbox')
  @RequirePermissions(Permission.VIEW_SYSTEM_OUTBOX)
  async getOutbox(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('eventType') eventType?: string,
  ): Promise<AdminPaginatedResponse<any>> {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skipPage = Math.max(0, pageNum - 1);

    const response = await this.reportingService.getOutbox({
      status,
      eventType,
      page: skipPage,
      limit: limitNum,
    });

    const content = Array.isArray(response) ? response : response.content || [];
    const totalElements = response.totalElements || content.length;
    const totalPages =
      response.totalPages || Math.ceil(totalElements / limitNum) || 1;

    return {
      data: content,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalElements,
        totalPages: totalPages,
      },
    };
  }

  @Post('outbox/:id/retry')
  @RequirePermissions(Permission.RETRY_SYSTEM_OUTBOX)
  @AuditLog(
    null as any,
    ResourceType.SYSTEM_OUTBOX,
    'Retried outbox event delivery',
  )
  async retryOutbox(@Param('id') id: string) {
    return this.reportingService.retryOutbox(id);
  }
}
