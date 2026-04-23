import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { KYCService } from './kyc.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/role.enum';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AuditAction, ResourceType } from '../audit/audit.service';

@Controller('admin/kyc')
@UseGuards(PermissionsGuard)
export class KYCController {
  constructor(private readonly kycService: KYCService) {}

  @Get('pending')
  @RequirePermissions(Permission.VIEW_KYC)
  getPendingKYCList() {
    return this.kycService.getPendingKYCList();
  }

  @Get('history/:userId')
  @RequirePermissions(Permission.VIEW_KYC)
  getKYCHistory(@Param('userId') userId: string) {
    return this.kycService.getKYCHistory(userId);
  }

  @Post('approve/:documentId')
  @RequirePermissions(Permission.APPROVE_KYC)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.KYC_DOCUMENT,
    getResourceId: (req) => req.params.documentId,
  })
  approveDocument(
    @Param('documentId') documentId: string,
    @Body() body: { notes?: string },
  ) {
    return this.kycService.approveDocument(documentId, body.notes);
  }

  @Post('reject/:documentId')
  @RequirePermissions(Permission.APPROVE_KYC)
  @AuditLog({
    action: AuditAction.UPDATE,
    resourceType: ResourceType.KYC_DOCUMENT,
    getResourceId: (req) => req.params.documentId,
  })
  rejectDocument(
    @Param('documentId') documentId: string,
    @Body() body: { reason: string },
  ) {
    return this.kycService.rejectDocument(documentId, body.reason);
  }

  @Get('documents')
  @RequirePermissions(Permission.VIEW_KYC)
  getAllDocuments() {
    return this.kycService.getAllDocuments();
  }

  @Get('documents/user/:userId')
  @RequirePermissions(Permission.VIEW_KYC)
  getUserDocuments(@Param('userId') userId: string) {
    return this.kycService.getUserDocuments(userId);
  }

  @Get('pii/:userId/:field')
  @RequirePermissions(Permission.VIEW_PII)
  @AuditLog({
    action: AuditAction.READ,
    resourceType: ResourceType.PII,
    getResourceId: (req) => `${req.params.userId}/${req.params.field}`,
  })
  getPII(@Param('userId') userId: string, @Param('field') field: string) {
    return this.kycService.getPII(userId, field);
  }
}
