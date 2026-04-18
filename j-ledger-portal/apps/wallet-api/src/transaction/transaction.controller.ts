import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TransactionPinGuard } from '../common/guards/transaction-pin.guard';
import { RequireIdempotency } from '../common/decorators/idempotency.decorator';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { TransferDto } from './dto/transfer.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly ledgerProxy: LedgerProxyService) {}

  @UseGuards(JwtAuthGuard, TransactionPinGuard)
  @RequireIdempotency()
  @Post('transfer')
  async transfer(@Body() body: TransferDto) {
    const { fromAccountId, toAccountId, amount, currency } = body;

    // Forward to Core Service via Gateway
    return this.ledgerProxy.forwardToGateway(
      'post',
      '/api/v1/transactions/transfer',
      { fromAccountId, toAccountId, amount, currency },
      fromAccountId, // Mapping as sender ID
    );
  }
}
