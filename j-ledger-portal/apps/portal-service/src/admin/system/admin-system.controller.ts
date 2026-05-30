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

@Controller('admin/system')
@UseGuards(AdminJwtGuard, AdminRolesGuard, AdminPermissionsGuard)
export class AdminSystemController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly financeService: FinanceService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly kafkaProducer: KafkaProducerService,
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
    const keys = await this.redis.keys('admin:approvals:item:*');
    const rows = (
      await Promise.all(
        keys.map(async (key) => {
          const raw = await this.redis.get(key);
          if (!raw) return null;

          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        }),
      )
    ).filter(Boolean);

    const searchTerm = search?.trim().toLowerCase();
    const normalizedStatus = status && status !== 'ALL' ? status : undefined;
    const normalizedCategory =
      category && category !== 'ALL' ? category : undefined;

    const filtered = rows
      .filter((item: any) => {
        const matchesStatus =
          !normalizedStatus || item.status === normalizedStatus;
        const matchesCategory =
          !normalizedCategory || item.category === normalizedCategory;
        const matchesSearch =
          !searchTerm ||
          [
            item.id,
            item.action,
            item.proposedBy,
            item.reason,
            item.originalValue,
            item.proposedValue,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(searchTerm));

        return matchesStatus && matchesCategory && matchesSearch;
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.proposedAt).getTime() - new Date(a.proposedAt).getTime(),
      );

    const start = (safePage - 1) * safeLimit;
    const data = filtered.slice(start, start + safeLimit);

    return {
      data,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / safeLimit)),
      },
      stats: {
        pending: filtered.filter((item: any) => item.status === 'PENDING')
          .length,
        approved: filtered.filter((item: any) => item.status === 'APPROVED')
          .length,
        rejected: filtered.filter((item: any) => item.status === 'REJECTED')
          .length,
      },
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
    const id =
      body.id ||
      `APR-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 6)
        .toUpperCase()}`;
    const record = {
      id,
      target: body.target || 'SYSTEM_SETTINGS',
      category: body.category || 'SECURITY',
      action: body.action || 'System Change Request',
      proposedBy: body.proposedBy || 'Admin Operator',
      proposedAt: body.proposedAt || new Date().toISOString(),
      originalValue: body.originalValue || 'N/A',
      proposedValue: body.proposedValue || 'N/A',
      payload: body.payload || null,
      status: 'PENDING',
      reason: body.reason || 'No reason provided',
      notes: body.notes || null,
    };

    await this.redis.set(`admin:approvals:item:${id}`, JSON.stringify(record));
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
    const key = `admin:approvals:item:${id}`;
    const raw = await this.redis.get(key);
    if (!raw) {
      return { data: null };
    }

    const current = JSON.parse(raw);
    if (body.decision === 'APPROVED') {
      if (current.target === 'SYSTEM_SETTINGS' && current.payload) {
        await this.financeService.updateSystemSettings(current.payload);
      } else if (current.action === 'EXPORT_STATEMENT' && current.payload) {
        const { userId, year, month, email } = current.payload;
        
        // Fetch transactions for the statement period
        const txs = await this.financeService.getTransactions(userId, {
          page: 0,
          size: 100,
        });

        // Filter transactions by month/year if possible
        const filteredTxs = txs.filter((t: any) => {
          if (!t.createdAt) return false;
          const d = new Date(t.createdAt);
          return d.getFullYear() === Number(year) && (d.getMonth() + 1) === Number(month);
        });

        // Format a beautiful text listing of transactions
        let txText = '';
        if (filteredTxs.length === 0) {
          txText = 'No transactions found for this period.';
        } else {
          txText = filteredTxs.map((t: any) => {
            const date = new Date(t.createdAt).toLocaleDateString();
            const type = t.type || 'TRANSFER';
            const amount = t.amount ? t.amount.toFixed(2) : '0.00';
            const direction = t.direction || 'OUT';
            const note = t.note ? ` (${t.note})` : '';
            return `${date} | ${type} | ${direction} | ${amount} THB${note}`;
          }).join('\n');
        }

        // Generate mock PDF attachment
        const title = `P-Wallet Statement - ${month}/${year}`;
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

    const updated = {
      ...current,
      status: body.decision,
      notes: body.notes || 'Actioned by Admin Checker',
      actionedAt: new Date().toISOString(),
    };

    await this.redis.set(key, JSON.stringify(updated));
    return { data: updated };
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
