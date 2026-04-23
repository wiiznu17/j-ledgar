import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { KYCService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InternalAuthGuard } from '../auth/guards/internal-auth.guard';
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
  @UseGuards(InternalAuthGuard)
  approveDocument(@Param('documentId') documentId: string, @Body() dto: ApproveDocumentDto) {
    return this.kycService.approveDocument(documentId);
  }

  @Post('reject/:documentId')
  @UseGuards(InternalAuthGuard)
  rejectDocument(@Param('documentId') documentId: string, @Body() dto: RejectDocumentDto) {
    return this.kycService.rejectDocument(documentId, dto.reason);
  }

  // Admin endpoints
  @Get('admin/pending')
  @UseGuards(InternalAuthGuard)
  getPendingKYCList() {
    return this.kycService.getPendingKYCList();
  }

  @Get('admin/history/:userId')
  @UseGuards(InternalAuthGuard)
  getKYCHistory(@Param('userId') userId: string) {
    return this.kycService.getKYCHistory(userId);
  }
}
