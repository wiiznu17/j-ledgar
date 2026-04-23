import { Controller, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { TopUpDto } from './dto/topup.dto';
import type { Request } from 'express';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':userId/topup/bank')
  async topUpBank(
    @Param('userId') userId: string,
    @Body() body: { amount: number; bankAccount: string },
    @Req() req: Request & { user: { sub: string } },
  ) {
    const authenticatedUserId = req.user.sub;
    return this.paymentService.topUpBank(authenticatedUserId, body);
  }

  @Post(':userId/topup/counter')
  async topUpCounter(
    @Param('userId') userId: string,
    @Body() body: { amount: number; counterCode: string },
    @Req() req: Request & { user: { sub: string } },
  ) {
    const authenticatedUserId = req.user.sub;
    return this.paymentService.topUpCounter(authenticatedUserId, body);
  }

  @Post(':userId/topup/cash')
  async topUpCash(
    @Param('userId') userId: string,
    @Body() body: { amount: number; agentId: string },
    @Req() req: Request & { user: { sub: string } },
  ) {
    const authenticatedUserId = req.user.sub;
    return this.paymentService.topUpCash(authenticatedUserId, body);
  }
}
