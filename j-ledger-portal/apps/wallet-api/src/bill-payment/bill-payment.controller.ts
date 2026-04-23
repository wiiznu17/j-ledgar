import { Controller, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { BillPaymentService } from './bill-payment.service';
import type { Request } from 'express';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class BillPaymentController {
  constructor(private readonly billPaymentService: BillPaymentService) {}

  @Post(':userId/payment/utility')
  async payUtilityBill(
    @Param('userId') userId: string,
    @Body() body: { amount: number; billerCode: string; accountNumber: string },
    @Req() req: Request & { user: { sub: string } },
  ) {
    const authenticatedUserId = req.user.sub;
    return this.billPaymentService.payUtilityBill(authenticatedUserId, body);
  }

  @Post(':userId/payment/credit-card')
  async payCreditCardBill(
    @Param('userId') userId: string,
    @Body() body: { amount: number; cardNumber: string },
    @Req() req: Request & { user: { sub: string } },
  ) {
    const authenticatedUserId = req.user.sub;
    return this.billPaymentService.payCreditCardBill(authenticatedUserId, body);
  }

  @Post(':userId/payment/mobile')
  async payMobileTopup(
    @Param('userId') userId: string,
    @Body() body: { amount: number; phoneNumber: string },
    @Req() req: Request & { user: { sub: string } },
  ) {
    const authenticatedUserId = req.user.sub;
    return this.billPaymentService.payMobileTopup(authenticatedUserId, body);
  }
}
