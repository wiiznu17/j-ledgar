import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Headers,
  Req,
} from '@nestjs/common';
import { KycService } from '../../modules/kyc/kyc.service';
import { ConfirmOcrDto } from '../../modules/kyc/dto/kyc.dto';
import { JwtAuthGuard } from '../../core/common/guards/jwt-auth.guard';
import { RegistrationAuthGuard } from '../../core/common/guards/registration-auth.guard';
import { InternalAuthGuard } from '../../core/common/guards/internal-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import { Request } from 'express';

@Controller('kyc')
export class KycController {
  private readonly logger = new Logger(KycController.name);

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

  @Post('upload-id-card/simple')
  @UseGuards(RegistrationAuthGuard)
  @UseInterceptors(FileInterceptor('idCardImage'))
  async uploadIdCardSimple(
    @UploadedFile() file: any,
    @Body('userId') userId: string,
    @Headers('authorization') authorization: string,
    @Req() request: Request,
  ) {
    this.logger.log(
      `[KYC Controller] uploadIdCardSimple called, userId from body: ${userId}, has file: ${!!file}`,
    );
    this.logger.log(`[KYC Controller] Authorization header present: ${!!authorization}`);

    if (!file) {
      this.logger.error('[KYC Controller] No file uploaded');
      throw new Error('No file uploaded');
    }

    this.logger.log(
      `[KYC Controller] File size: ${file.buffer ? file.buffer.length : 'unknown'} bytes`,
    );

    // Extract userId from token if not provided in body
    let targetUserId = userId;
    if (!userId) {
      // Try to get userId from token payload
      const user = (request as any).user;
      if (user && user.sub) {
        targetUserId = user.sub;
        this.logger.log(`[KYC Controller] Using userId from token: ${targetUserId}`);
      }
    }

    return this.kycService.uploadIdCardSimple(targetUserId, file.buffer);
  }

  @Post('confirm-ocr')
  @UseGuards(RegistrationAuthGuard)
  async confirmOcrData(
    @Body() dto: ConfirmOcrDto,
    @Body('userId') userId: string,
    @Headers('authorization') authorization: string,
    @Req() request: Request,
  ) {
    let targetUserId = userId;
    if (!userId) {
      const user = (request as any).user;
      if (user && user.sub) {
        targetUserId = user.sub;
      }
    }
    
    this.logger.log(`[KYC Controller] confirmOcrData for user ${targetUserId}, Data: ${JSON.stringify(dto)}`);
    return this.kycService.confirmOcrData(targetUserId, dto);
  }

  @Post('submit-selfie/simple')
  @UseGuards(RegistrationAuthGuard)
  @UseInterceptors(FileInterceptor('selfieImage'))
  async submitSelfieSimple(
    @UploadedFile() file: any,
    @Body('userId') userId: string,
    @Headers('authorization') authorization: string,
    @Req() request: Request,
  ) {
    this.logger.log(
      `[KYC Controller] submitSelfieSimple called, userId from body: ${userId}, has file: ${!!file}`,
    );
    this.logger.log(`[KYC Controller] Authorization header present: ${!!authorization}`);

    if (!file) {
      this.logger.error('[KYC Controller] No file uploaded');
      throw new Error('No file uploaded');
    }

    this.logger.log(
      `[KYC Controller] File size: ${file.buffer ? file.buffer.length : 'unknown'} bytes`,
    );

    // Extract userId from token if not provided in body
    let targetUserId = userId;
    if (!userId) {
      // Try to get userId from token payload
      const user = (request as any).user;
      if (user && user.sub) {
        targetUserId = user.sub;
        this.logger.log(`[KYC Controller] Using userId from token: ${targetUserId}`);
      }
    }

    return this.kycService.submitSelfieSimple(targetUserId, file.buffer);
  }
}
