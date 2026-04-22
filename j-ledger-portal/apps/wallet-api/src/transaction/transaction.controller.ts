import { Controller, Post, Body, UseGuards, Req, Headers } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TransactionPinGuard } from '../common/guards/transaction-pin.guard';
import { RequireIdempotency } from '../common/decorators/idempotency.decorator';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { TransferDto } from './dto/transfer.dto';
import { UserService } from '../user/user.service';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
  };
}

@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly ledgerProxy: LedgerProxyService,
    private readonly userService: UserService,
  ) {}

  @UseGuards(JwtAuthGuard, TransactionPinGuard)
  @RequireIdempotency()
  @Post('transfer')
  async transfer(
    @Body() body: TransferDto,
    @Req() req: AuthenticatedRequest,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    const { toAccountId, amount, currency } = body;
    const userId = req.user.sub;
    const fromAccountId = await this.userService.resolveLedgerAccountId(userId);

    return this.ledgerProxy.forwardToGateway(
      'post',
      '/api/v1/transactions/transfer',
      { fromAccountId, toAccountId, amount, currency },
      fromAccountId,
      { 'Idempotency-Key': idempotencyKey },
    );
  }
}
