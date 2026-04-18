import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TransactionPinGuard } from '../common/guards/transaction-pin.guard';
import { MerchantService } from './merchant.service';
import { ScanPayDto } from './dto/scan-pay.dto';

import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    id: string;
  };
}

@Controller('api/merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Post('scan-pay')
  @UseGuards(JwtAuthGuard, TransactionPinGuard)
  async scanPay(
    @Req() req: AuthenticatedRequest, 
    @Body() dto: ScanPayDto
  ) {
    const userId = req.user.id;
    // In actual app, we might need a better way to select the account
    // for now we assume accountId == userId for simplicity if they match,
    // or we can select the default account from DB. 
    // Here we'll use a fixed pattern for the demo.
    const accountId = userId; 

    return this.merchantService.processScanPay(userId, accountId, dto);
  }
}
