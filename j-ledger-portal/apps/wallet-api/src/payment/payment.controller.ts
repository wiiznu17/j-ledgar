import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { TopUpDto } from './dto/topup.dto';
import { Request } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('topup')
  async initiateTopUp(@Body() topUpDto: TopUpDto, @Req() req: Request & { user: { sub: string } }) {
    const userId = req.user.sub;
    return this.paymentService.initiateTopUp(userId, topUpDto);
  }
}
