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
  UnauthorizedException,
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

  @Get('pending')
  getPending() {
    return this.kycService.getPendingKYCList();
  }

  @Get('details/:userId')
  getDetails(@Param('userId') userId: string) {
    return this.kycService.getKYCDetails(userId);
  }

  @Post('approve/:userId')
  approveKyc(@Param('userId') userId: string) {
    return this.kycService.approveKyc(userId);
  }

  @Post('reject/:userId')
  rejectKyc(@Param('userId') userId: string, @Body('reason') reason: string) {
    return this.kycService.rejectKyc(userId, reason);
  }

  @Post('retry')
  @UseGuards(JwtAuthGuard)
  async retryKyc(@Req() request: Request) {
    const user = (request as any).user;
    return this.kycService.retryKyc(user.sub);
  }

  @Post('upload-id-card')
  @UseGuards(RegistrationAuthGuard)
  @UseInterceptors(FileInterceptor('idCardImage'))
  async uploadIdCard(@UploadedFile() file: any, @Req() request: Request) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const user = (request as any).user;
    if (!user || !user.sub) {
      throw new UnauthorizedException('User not found in token');
    }

    return this.kycService.uploadIdCard(user.sub, file.buffer);
  }

  @Post('submit-selfie')
  @UseGuards(RegistrationAuthGuard)
  @UseInterceptors(FileInterceptor('selfieImage'))
  async submitSelfie(@UploadedFile() file: any, @Req() request: Request) {
    const user = (request as any).user;
    if (!user || !user.sub) {
      throw new UnauthorizedException('User not found in token');
    }

    return this.kycService.submitSelfie(user.sub, file?.buffer);
  }

  @Post('verify-liveness')
  @UseGuards(RegistrationAuthGuard)
  async verifyLiveness(@Req() request: Request) {
    const user = (request as any).user;
    if (!user || !user.sub) {
      throw new UnauthorizedException('User not found in token');
    }

    return this.kycService.submitSelfie(user.sub);
  }

  @Post('upload-id-card/simple')
  @UseGuards(RegistrationAuthGuard)
  @UseInterceptors(FileInterceptor('idCardImage'))
  async uploadIdCardSimple(
    @UploadedFile() file: any,
    @Headers('authorization') authorization: string,
    @Req() request: Request,
  ) {
    this.logger.log(`[KYC Controller] uploadIdCardSimple called, has file: ${!!file}`);
    this.logger.log(`[KYC Controller] Authorization header present: ${!!authorization}`);

    if (!file) {
      this.logger.error('[KYC Controller] No file uploaded');
      throw new Error('No file uploaded');
    }

    this.logger.log(
      `[KYC Controller] File size: ${file.buffer ? file.buffer.length : 'unknown'} bytes`,
    );

    const user = (request as any).user;
    if (!user || !user.sub) {
      throw new UnauthorizedException('User not found in token');
    }

    return this.kycService.uploadIdCardSimple(user.sub, file.buffer);
  }

  @Post('confirm-ocr')
  @UseGuards(RegistrationAuthGuard)
  async confirmOcrData(
    @Body() dto: ConfirmOcrDto,
    @Headers('authorization') authorization: string,
    @Req() request: Request,
  ) {
    const user = (request as any).user;
    if (!user || !user.sub) {
      throw new UnauthorizedException('User not found in token');
    }

    this.logger.log(
      `[KYC Controller] confirmOcrData for user ${user.sub}, Data: ${JSON.stringify(dto)}`,
    );
    return this.kycService.confirmOcrData(user.sub, dto);
  }

  @Post('submit-selfie/simple')
  @UseGuards(RegistrationAuthGuard)
  @UseInterceptors(FileInterceptor('selfieImage'))
  async submitSelfieSimple(
    @UploadedFile() file: any,
    @Headers('authorization') authorization: string,
    @Req() request: Request,
  ) {
    this.logger.log(`[KYC Controller] submitSelfieSimple called, has file: ${!!file}`);
    this.logger.log(`[KYC Controller] Authorization header present: ${!!authorization}`);

    if (!file) {
      this.logger.error('[KYC Controller] No file uploaded');
      throw new Error('No file uploaded');
    }

    this.logger.log(
      `[KYC Controller] File size: ${file.buffer ? file.buffer.length : 'unknown'} bytes`,
    );

    const user = (request as any).user;
    if (!user || !user.sub) {
      throw new UnauthorizedException('User not found in token');
    }

    return this.kycService.submitSelfieSimple(user.sub, file.buffer);
  }
}
