import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TransactionPinGuard } from '../common/guards/transaction-pin.guard';
import { MerchantService } from './merchant.service';
import { ScanPayDto } from './dto/scan-pay.dto';
import { UserService } from '../user/user.service';

import type { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    sub: string;
  };
}

@Controller('api/merchant')
export class MerchantController {
  constructor(
    private readonly merchantService: MerchantService,
    private readonly userService: UserService,
  ) {}

  @Post('scan-pay')
  @UseGuards(JwtAuthGuard, TransactionPinGuard)
  async scanPay(
    @Req() req: AuthenticatedRequest, 
    @Body() dto: ScanPayDto
  ) {
    const userId = req.user.sub;
    const accountId = await this.userService.resolveLedgerAccountId(userId);

    return this.merchantService.processScanPay(accountId, dto);
  }
}
