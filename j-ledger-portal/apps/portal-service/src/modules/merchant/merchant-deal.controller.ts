import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { TerminalAuthGuard } from '../../core/common/guards/terminal-auth.guard';

@Controller('api/merchant/deals')
export class MerchantDealController {
  constructor(private readonly merchantService: MerchantService) {}

  @Get('redemptions/:code/verify')
  @UseGuards(TerminalAuthGuard)
  async verifyCode(@Param('code') code: string, @Req() req: any) {
    return this.merchantService.verifyRedemption(code, req.terminalId);
  }

  @Post('redemptions/:code/use')
  @UseGuards(TerminalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async useCode(@Param('code') code: string, @Req() req: any) {
    return this.merchantService.useRedemption(code, req.terminalId);
  }
}
