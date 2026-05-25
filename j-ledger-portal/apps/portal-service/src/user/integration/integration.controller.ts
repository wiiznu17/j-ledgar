import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { IntegrationService } from '../../modules/integration/integration.service';
import { JwtAuthGuard } from '../../core/common/guards/jwt-auth.guard';
import { PinVerifiedGuard } from '../../core/common/guards/pin-verified.guard';

interface TopUpBody {
  amount: number;
  bankAccountId: number;
}

interface TopupIntentBody {
  amount: number;
  currency?: 'THB';
  note?: string;
}

interface P2PPreviewBody {
  recipientPhone: string;
  amount: number;
}

interface P2PTransferBody extends P2PPreviewBody {
  note?: string;
  idempotencyKey: string;
}

interface HistoryQuery {
  page?: number;
  size?: number;
  type?: 'TOPUP' | 'TRANSFER' | 'PAYMENT' | 'WITHDRAWAL';
  q?: string;
  from?: string;
  to?: string;
}

@Controller('integration')
@UseGuards(JwtAuthGuard)
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  // ==================== Dashboard BFF ====================

  @Get('dashboard')
  async getDashboard(@Req() req: any) {
    const userId = req.user?.sub;
    return this.integrationService.getDashboardData(userId);
  }

  @Get('bank-accounts')
  async getBankAccounts(@Req() req: any) {
    const userId = req.user?.sub;
    return this.integrationService.getLinkedBankAccounts(userId);
  }

  @Post('topup')
  async topUp(@Req() req: any, @Body() body: TopUpBody) {
    const userId = req.user?.sub;
    return this.integrationService.topUp(
      userId,
      body.amount,
      body.bankAccountId,
    );
  }

  @Post('topup/intent')
  @UseGuards(PinVerifiedGuard)
  async createTopupIntent(@Req() req: any, @Body() body: TopupIntentBody) {
    const userId = req.user?.sub;
    return this.integrationService.createStripeTopupIntent(
      userId,
      body.amount,
      body.currency || 'THB',
      body.note,
    );
  }

  @Get('topup/:orderId')
  async getTopupStatus(@Req() req: any, @Param('orderId') orderId: string) {
    const userId = req.user?.sub;
    return this.integrationService.getTopupOrderStatus(userId, orderId);
  }

  @Post('p2p/preview')
  async previewP2P(@Req() req: any, @Body() body: P2PPreviewBody) {
    const userId = req.user?.sub;
    return this.integrationService.previewP2PTransfer(userId, body);
  }

  @Post('p2p/transfer')
  @UseGuards(JwtAuthGuard, PinVerifiedGuard)
  async transferP2P(@Req() req: any, @Body() body: P2PTransferBody) {
    const userId = req.user?.sub;
    return this.integrationService.transferP2P(userId, body);
  }

  // ==================== Transaction History ====================

  @Get('history')
  async getHistory(@Req() req: any, @Query() query: HistoryQuery) {
    const userId = req.user?.sub;
    return this.integrationService.getHistory(userId, query);
  }

  @Get('transactions/:userId')
  async getTransactionHistoryDeprecated(
    @Param('userId') _userId: string,
    @Req() req: any,
    @Query('page') page?: number,
    @Query('size') size?: number,
  ) {
    const userId = req.user?.sub;
    return this.integrationService.getHistory(userId, { page, size });
  }

  @Get('transactions/details/:transactionId')
  async getTransactionDetails(
    @Req() req: any,
    @Param('transactionId') transactionId: string,
  ) {
    const userId = req.user?.sub;
    return this.integrationService.getTransactionDetails(transactionId, userId);
  }
}
