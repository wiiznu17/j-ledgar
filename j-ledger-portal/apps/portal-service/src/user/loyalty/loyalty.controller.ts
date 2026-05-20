import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { LoyaltyService } from '../../modules/loyalty/loyalty.service';
import { JwtAuthGuard } from '../../core/common/guards/jwt-auth.guard';

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('balance')
  async getBalance(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.loyaltyService.getUserBalance(userId);
  }

  @Get('history')
  async getHistory(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.loyaltyService.getPointHistory(userId);
  }
}
