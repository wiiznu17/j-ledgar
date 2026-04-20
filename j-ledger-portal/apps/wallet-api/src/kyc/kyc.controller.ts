import {
  Controller,
  Post,
  Headers,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KycService } from './kyc.service';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  /**
   * Phase 1: Upload ID Card OCR
   */
  @Post('id-card')
  @UseInterceptors(FileInterceptor('idCardImage'))
  async uploadIdCard(
    @Headers('authorization') authorization: string | undefined,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('idCardImage must be provided');
    }

    return this.kycService.uploadIdCard(authorization, file);
  }

  /**
   * Phase 2: Upload Selfie and Face Comparison
   */
  @Post('selfie')
  @UseInterceptors(FileInterceptor('selfieImage'))
  async submitSelfie(
    @Headers('authorization') authorization: string | undefined,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('selfieImage must be provided');
    }

    return this.kycService.submitSelfie(authorization, file);
  }
}
