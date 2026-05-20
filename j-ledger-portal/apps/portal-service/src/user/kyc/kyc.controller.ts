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
  BadRequestException,
} from '@nestjs/common';
import { extname } from 'path';
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

  private readonly fileValidationConfig = {
    fileFilter: (req: any, file: any, cb: any) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
      
      const ext = extname(file.originalname).toLowerCase();

      if (!allowedMimes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
        return cb(new BadRequestException(`Only JPEG, PNG, and PDF files allowed. Received: ${file.mimetype}`), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  };

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
  @UseInterceptors(function (this: KycController) { return FileInterceptor('idCardImage', this.fileValidationConfig); }.call(KycController.prototype))
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
  @UseInterceptors(function (this: KycController) { return FileInterceptor('selfieImage', this.fileValidationConfig); }.call(KycController.prototype))
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
  @UseInterceptors(function (this: KycController) { return FileInterceptor('idCardImage', this.fileValidationConfig); }.call(KycController.prototype))
  async uploadIdCardSimple(
    @UploadedFile() file: any,
    @Headers('authorization') authorization: string,
    @Req() request: Request,
  ) {
    this.logger.log(
      `[KYC Controller] uploadIdCardSimple called, has file: ${!!file}`,
    );
    this.logger.log(
      `[KYC Controller] Authorization header present: ${!!authorization}`,
    );

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
  @UseInterceptors(function (this: KycController) { return FileInterceptor('selfieImage', this.fileValidationConfig); }.call(KycController.prototype))
  async submitSelfieSimple(
    @UploadedFile() file: any,
    @Headers('authorization') authorization: string,
    @Req() request: Request,
  ) {
    this.logger.log(
      `[KYC Controller] submitSelfieSimple called, has file: ${!!file}`,
    );
    this.logger.log(
      `[KYC Controller] Authorization header present: ${!!authorization}`,
    );

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
