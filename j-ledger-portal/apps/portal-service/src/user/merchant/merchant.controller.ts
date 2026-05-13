import {
  Controller,
  Get,
  UseGuards,
  Req,
  Query,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { MerchantService } from '../../modules/merchant/merchant.service';
import { JwtAuthGuard } from '../../core/common/guards/jwt-auth.guard';
import { ApplyMerchantDto } from './dto/apply-merchant.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../../core/storage/storage.service';

@Controller('merchant')
@UseGuards(JwtAuthGuard)
export class MerchantController {
  constructor(
    private readonly merchantService: MerchantService,
    private readonly storageService: StorageService,
  ) {}

  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    const userId = req.user?.sub;
    return this.merchantService.getMerchantDashboard(userId);
  }

  @Get('transactions')
  async getTransactions(@Req() req: any, @Query() query: any) {
    const userId = req.user?.sub;
    return this.merchantService.getMerchantTransactions(userId, query);
  }

  @Get('terminals')
  async getTerminals(@Req() req: any) {
    const userId = req.user?.sub;
    return this.merchantService.getMerchantTerminals(userId);
  }

  @Post('apply')
  async apply(@Req() req: any, @Body() body: ApplyMerchantDto) {
    const userId = req.user?.sub;
    return this.merchantService.applyMerchant(userId, body);
  }

  @Post('upload-storefront-images')
  @UseInterceptors(FilesInterceptor('images', 5))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      return { urls: [] };
    }

    const uploadPromises = files.map(file => {
      const fileName = `${Date.now()}-${file.originalname}`;
      return this.storageService.uploadFile(
        file.buffer,
        fileName,
        file.mimetype,
        'merchants/storefront',
      );
    });

    const results = await Promise.all(uploadPromises);
    return { urls: results };
  }
}
