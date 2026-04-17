import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaymentService } from './payment.service';
import { TopUpDto } from './dto/topup.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('topup')
  async initiateTopUp(@Body() topUpDto: TopUpDto, @Req() req: any) {
    const userId = req.user.sub;
    return this.paymentService.initiateTopUp(userId, topUpDto);
  }
}
