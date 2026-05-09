import { Controller, Get, Post, Param, Body, Query, Req, UseGuards, Logger } from '@nestjs/common';
import { KycService } from '../../modules/kyc/kyc.service';
import { AuditService, ResourceType } from '../../modules/audit/audit.service';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { AdminRolesGuard } from '../guards/admin-roles.guard';
import { AdminPermissionsGuard } from '../guards/admin-permissions.guard';
import { Permissions as RequirePermissions } from '../decorators/permissions.decorator';
import { AuditLog } from '../decorators/audit.decorator';
import { Permission } from '@repo/dto';

@Controller('admin/kyc')
@UseGuards(AdminJwtGuard, AdminRolesGuard, AdminPermissionsGuard)
export class AdminKycController {
  private readonly logger = new Logger(AdminKycController.name);

  constructor(
    private readonly kycService: KycService,
    private readonly auditService: AuditService,
  ) {}

  @Get('stats')
  async getKYCStats() {
    this.logger.log('[AdminKyc] Fetching KYC stats for dashboard');
    return this.kycService.getKYCStats();
  }

  @Post('approve/:userId')
  @RequirePermissions(Permission.APPROVE_KYC)
  @AuditLog(null as any, ResourceType.KYC_DOCUMENT, 'Approved user KYC document')
  async approveKyc(@Param('userId') userId: string) {
    this.logger.log(`[AdminKyc] Approving KYC for user: ${userId}`);
    return this.kycService.approveKyc(userId);
  }

  @Post('reject/:userId')
  @RequirePermissions(Permission.REJECT_KYC)
  @AuditLog(null as any, ResourceType.KYC_DOCUMENT, 'Rejected user KYC document')
  async rejectKyc(@Param('userId') userId: string, @Body('reason') reason: string) {
    this.logger.log(`[AdminKyc] Rejecting KYC for user: ${userId}, Reason: ${reason}`);
    return this.kycService.rejectKyc(userId, reason);
  }

  @Get('pending')
  async getPendingKYCList() {
    this.logger.log('[AdminKyc] Fetching pending KYC list');
    return this.kycService.getPendingKYCList();
  }

  @Get('list')
  async getKYCList(
    @Query('status') status: string,
    @Query('phoneNumber') phoneNumber?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = parseInt(page || '1', 10);
    const limitNumber = parseInt(limit || '50', 10);
    this.logger.log(
      `[AdminKyc] Fetching KYC list - status: ${status}, page: ${pageNumber}, limit: ${limitNumber}`,
    );
    return this.kycService.getKYCList(
      status,
      phoneNumber,
      startDate,
      endDate,
      pageNumber,
      limitNumber,
    );
  }

  @Get('details/:userId')
  async getKYCDetails(@Param('userId') userId: string) {
    this.logger.log(`[AdminKyc] Fetching KYC details for user: ${userId}`);
    const result = await this.kycService.getKYCDetails(userId);
    this.logger.log(`[AdminKyc] KYC details for ${userId}: ${JSON.stringify(result)}`);
    return result;
  }

  @Get('history/:userId')
  async getKYCHistory(@Param('userId') userId: string) {
    this.logger.log(`[AdminKyc] Fetching KYC history for user: ${userId}`);
    const result = await this.kycService.getKYCHistory(userId);
    return result;
  }
}
