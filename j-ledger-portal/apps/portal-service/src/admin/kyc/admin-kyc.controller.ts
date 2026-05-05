import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { KycService } from '../../modules/kyc/kyc.service';
import { AuditService, AuditAction, ResourceType } from '../../modules/audit/audit.service';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { Request } from 'express';

@Controller('admin/kyc')
@UseGuards(AdminJwtGuard)
export class AdminKycController {
  private readonly logger = new Logger(AdminKycController.name);

  constructor(
    private readonly kycService: KycService,
    private readonly auditService: AuditService,
  ) {}

  @Post('approve/:userId')
  async approveKyc(@Param('userId') userId: string, @Req() req: any) {
    this.logger.log(`[AdminKyc] Approving KYC for user: ${userId}`);
    const result = await this.kycService.approveKyc(userId);
    
    // Log Audit
    await this.auditService.log({
      adminUserId: req.user?.id || 'system',
      action: AuditAction.UPDATE,
      resourceType: ResourceType.KYC_DOCUMENT,
      resourceId: userId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      requestPayload: { userId, action: 'APPROVE' },
      responseStatus: 200,
      reason: 'KYC Approved by Admin',
    });

    this.logger.log(`[AdminKyc] Approved result: ${JSON.stringify(result)}`);
    return result;
  }

  @Post('reject/:userId')
  async rejectKyc(@Param('userId') userId: string, @Body('reason') reason: string, @Req() req: any) {
    this.logger.log(`[AdminKyc] Rejecting KYC for user: ${userId}, Reason: ${reason}`);
    const result = await this.kycService.rejectKyc(userId, reason);
    
    // Log Audit
    await this.auditService.log({
      adminUserId: req.user?.id || 'system',
      action: AuditAction.UPDATE,
      resourceType: ResourceType.KYC_DOCUMENT,
      resourceId: userId,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      requestPayload: { userId, action: 'REJECT', reason },
      responseStatus: 200,
      reason: `KYC Rejected: ${reason}`,
    });

    this.logger.log(`[AdminKyc] Rejected result: ${JSON.stringify(result)}`);
    return result;
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
    this.logger.log(`[AdminKyc] Fetching KYC list - status: ${status}, page: ${pageNumber}, limit: ${limitNumber}`);
    return this.kycService.getKYCList(status, phoneNumber, startDate, endDate, pageNumber, limitNumber);
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
