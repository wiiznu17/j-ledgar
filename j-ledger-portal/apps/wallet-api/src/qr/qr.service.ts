import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { UserService } from '../user/user.service';

@Injectable()
export class QrService {
  constructor(
    private readonly ledgerProxy: LedgerProxyService,
    private readonly userService: UserService,
  ) {}

  async generateQR(userId: string, amount: number) {
    const accountId = await this.userService.resolveLedgerAccountId(userId);
    return this.ledgerProxy.forwardToGateway(
      'post',
      `/api/v1/wallets/${accountId}/qr/generate`,
      { amount }
    );
  }
}
