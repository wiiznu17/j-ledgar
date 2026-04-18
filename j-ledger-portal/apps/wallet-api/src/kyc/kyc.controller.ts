import {
  Controller,
  Post,
  Headers,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { KycService } from './kyc.service';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'idCardImage', maxCount: 1 },
      { name: 'selfieImage', maxCount: 1 },
    ]),
  )
  async submitKyc(
    @Headers('authorization') authorization: string | undefined,
    @UploadedFiles() files: { idCardImage?: Express.Multer.File[]; selfieImage?: Express.Multer.File[] },
  ) {
    const idCardImage = files?.idCardImage?.[0];
    const selfieImage = files?.selfieImage?.[0];

    if (!idCardImage || !selfieImage) {
      throw new BadRequestException('Both idCardImage and selfieImage must be provided');
    }

    return this.kycService.submitKyc(
      authorization,
      idCardImage,
      selfieImage,
    );
  }
}
