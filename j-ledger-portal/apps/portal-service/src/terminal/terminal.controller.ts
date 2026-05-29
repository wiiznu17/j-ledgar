import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MerchantService } from '../modules/merchant/merchant.service';
import { TerminalAuthGuard } from '../core/common/guards/terminal-auth.guard';

import { TerminalPaymentDto } from './dto/terminal-payment.dto';
import { TerminalRedeemDto } from './dto/terminal-redeem.dto';

@Controller('v1/terminal')
@UseGuards(TerminalAuthGuard)
export class TerminalController {
  constructor(private readonly merchantService: MerchantService) {}

  @Post('payment')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async processPayment(@Req() req: any, @Body() body: TerminalPaymentDto) {
    return this.merchantService.processTerminalPayment(req.terminalId, body);
  }

  @Post('loyalty/redeem')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async processRedemption(@Req() req: any, @Body() body: TerminalRedeemDto) {
    return this.merchantService.processTerminalRedemption(req.terminalId, body);
  }
}

