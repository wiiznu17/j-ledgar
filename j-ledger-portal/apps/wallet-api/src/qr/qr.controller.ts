import { Controller, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { QrService } from './qr.service';
import type { Request } from 'express';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post(':userId/qr/generate')
  async generateQR(
    @Param('userId') userId: string,
    @Body() body: { amount: number },
    @Req() req: Request & { user: { sub: string } },
  ) {
    const authenticatedUserId = req.user.sub;
    return this.qrService.generateQR(authenticatedUserId, body.amount);
  }
}
