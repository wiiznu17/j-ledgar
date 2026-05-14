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
  Param,
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

  // ==================== Merchant Payments (QR) ====================

  @Post('payments/qr')
  async generateQR(@Req() req: any, @Body() body: { merchantId: string; amount: number; terminalId?: string }) {
    const userId = req.user?.sub;
    return this.merchantService.generatePaymentQR(userId, body.merchantId, body.amount, body.terminalId);
  }

  @Get('payments/static-qr')
  async getStaticQR(@Req() req: any, @Query('merchantId') merchantId: string) {
    const userId = req.user?.sub;
    return this.merchantService.generateStaticQR(userId, merchantId);
  }

  @Get('payments/:paymentId')
  async getPaymentDetail(@Param('paymentId') paymentId: string) {
    return this.merchantService.getPaymentDetail(paymentId);
  }

  @Post('payments/:paymentId/confirm')
  async confirmPayment(@Req() req: any, @Param('paymentId') paymentId: string) {
    const userId = req.user?.sub;
    return this.merchantService.processQRPayment(userId, paymentId);
  }

  @Get('manual-pay/preview')
  async previewManualPayment(@Query('merchantId') merchantId: string) {
    return this.merchantService.previewManualPayment(merchantId);
  }

  @Post('manual-pay/confirm')
  async confirmManualPayment(@Req() req: any, @Body() body: { merchantId: string; amount: number; note?: string }) {
    const userId = req.user?.sub;
    return this.merchantService.processManualPayment(userId, body.merchantId, body.amount, body.note);
  }
}
