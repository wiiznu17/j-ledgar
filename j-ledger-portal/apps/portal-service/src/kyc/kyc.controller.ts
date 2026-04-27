import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InternalAuthGuard } from '../common/guards/internal-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private kycService: KycService) {}

  @Get('status/:userId')
  getStatus(@Param('userId') userId: string) {
    return this.kycService.getKYCStatus(userId);
  }

  @Post('upload-id-card')
  @UseInterceptors(FileInterceptor('idCardImage'))
  async uploadIdCard(@UploadedFile() file: any, @Body('userId') userId: string) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.kycService.uploadIdCard(userId, file.buffer);
  }

  @Post('submit-selfie')
  @UseInterceptors(FileInterceptor('selfieImage'))
  async submitSelfie(@UploadedFile() file: any, @Body('userId') userId: string) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.kycService.submitSelfie(userId, file.buffer);
  }

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
