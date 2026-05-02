import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { KycService } from '../../modules/kyc/kyc.service';
import { AdminJwtGuard } from '../guards/admin-jwt.guard';
import { InternalAuthGuard } from '../../core/common/guards/internal-auth.guard';

@Controller('admin/kyc')
@UseGuards(AdminJwtGuard)
export class AdminKycController {
  constructor(private readonly kycService: KycService) {}

  @Post('approve/:documentId')
  @UseGuards(InternalAuthGuard)
  approveDocument(@Param('documentId') documentId: string) {
    return this.kycService.approveDocument(documentId);
  }

  @Post('reject/:documentId')
  @UseGuards(InternalAuthGuard)
  rejectDocument(@Param('documentId') documentId: string, @Body() dto: { reason: string }) {
    return this.kycService.rejectDocument(documentId, dto.reason);
  }

  @Get('pending')
  @UseGuards(InternalAuthGuard)
  getPendingKYCList() {
    return this.kycService.getPendingKYCList();
  }

  @Get('history/:userId')
  @UseGuards(InternalAuthGuard)
  getKYCHistory(@Param('userId') userId: string) {
    return this.kycService.getKYCHistory(userId);
  }
}
