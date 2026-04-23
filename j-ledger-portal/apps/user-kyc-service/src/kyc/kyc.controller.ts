import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { KYCService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KYCController {
  constructor(private kycService: KYCService) {}

  @Get('status/:userId')
  getStatus(@Param('userId') userId: string) {
    return this.kycService.getKYCStatus(userId);
  }

  @Post('approve/:documentId')
  approveDocument(@Param('documentId') documentId: string) {
    return this.kycService.approveDocument(documentId);
  }

  @Post('reject/:documentId')
  rejectDocument(@Param('documentId') documentId: string, @Body('reason') reason: string) {
    return this.kycService.rejectDocument(documentId, reason);
  }
}
