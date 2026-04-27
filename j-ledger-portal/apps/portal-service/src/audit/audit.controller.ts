import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AuditService, AuditAction, ResourceType, AuditLogData } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @UseGuards(InternalAuthGuard)
  async findAll(@Query() query: any) {
    return this.auditService.findAll(query);
  }

  @Post('log')
  @UseGuards(InternalAuthGuard)
  async log(@Body() data: AuditLogData, @Req() req: any) {
    // Auto-fill IP and user agent if not provided
    const auditData: AuditLogData = {
      ...data,
      ipAddress: data.ipAddress || req.ip,
      userAgent: data.userAgent || req.headers['user-agent'],
    };
    return this.auditService.log(auditData);
  }
}
