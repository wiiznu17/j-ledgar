import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';
import type { Request } from 'express';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':userId')
  async getWallet(@Param('userId') userId: string, @Req() req: Request & { user: { sub: string } }) {
    const authenticatedUserId = req.user.sub;
    return this.walletService.getWallet(authenticatedUserId);
  }

  @Get(':userId/limits')
  async getTransactionLimits(@Param('userId') userId: string, @Req() req: Request & { user: { sub: string } }) {
    const authenticatedUserId = req.user.sub;
    return this.walletService.getTransactionLimits(authenticatedUserId);
  }

  @Post(':userId/activate')
  async activateWallet(@Param('userId') userId: string, @Req() req: Request & { user: { sub: string } }) {
    const authenticatedUserId = req.user.sub;
    return this.walletService.activateWallet(authenticatedUserId);
  }
}
