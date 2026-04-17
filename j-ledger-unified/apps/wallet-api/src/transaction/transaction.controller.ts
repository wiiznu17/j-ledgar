import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequireIdempotency } from '../common/decorators/idempotency.decorator';
import { AuthService } from '../auth/auth.service';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';

@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly authService: AuthService,
    private readonly ledgerProxy: LedgerProxyService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @RequireIdempotency()
  @Post('transfer')
  async transfer(@Body() body: any, @Request() req: any) {
    const { fromAccountId, toAccountId, amount, currency, pin } = body;
    const userEmail = req.user.email;

    // 1. Validate PIN (Stateless)
    await this.authService.validatePinById(userEmail, pin);

    // 2. Forward to Core Service via Gateway
    return this.ledgerProxy.forwardToGateway(
      'post',
      '/api/v1/transactions/transfer',
      { fromAccountId, toAccountId, amount, currency },
      fromAccountId, // Mapping as sender ID
    );
  }
}
