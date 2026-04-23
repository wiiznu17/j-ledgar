import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { KYCService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApproveDocumentDto } from './dto/approve-document.dto';
import { RejectDocumentDto } from './dto/reject-document.dto';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KYCController {
  constructor(private kycService: KYCService) {}

  @Get('status/:userId')
  getStatus(@Param('userId') userId: string) {
    return this.kycService.getKYCStatus(userId);
  }

  @Post('approve/:documentId')
  approveDocument(@Param('documentId') documentId: string, @Body() dto: ApproveDocumentDto) {
    return this.kycService.approveDocument(documentId);
  }

  @Post('reject/:documentId')
  rejectDocument(@Param('documentId') documentId: string, @Body() dto: RejectDocumentDto) {
    return this.kycService.rejectDocument(documentId, dto.reason);
  }
}
