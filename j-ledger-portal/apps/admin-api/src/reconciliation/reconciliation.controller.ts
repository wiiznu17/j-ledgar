import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import type { ReconciliationQuery } from './reconciliation.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/role.enum';

@Controller('admin/reconciliation')
@UseGuards(PermissionsGuard)
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get('reports')
  @RequirePermissions(Permission.VIEW_RECONCILIATION_REPORTS)
  findAll(@Query() query: ReconciliationQuery) {
    return this.reconciliationService.findAll(query);
  }

  @Get('reports/:id')
  @RequirePermissions(Permission.VIEW_RECONCILIATION_REPORTS)
  findOne(@Param('id') id: string) {
    return this.reconciliationService.findOne(id);
  }

  @Post('run')
  @RequirePermissions(Permission.RUN_RECONCILIATION)
  runReconciliation() {
    return this.reconciliationService.runReconciliation();
  }
}
