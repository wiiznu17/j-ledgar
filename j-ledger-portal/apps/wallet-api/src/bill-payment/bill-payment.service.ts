import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { UserService } from '../user/user.service';

@Injectable()
export class BillPaymentService {
  constructor(
    private readonly ledgerProxy: LedgerProxyService,
    private readonly userService: UserService,
  ) {}

  async payUtilityBill(userId: string, body: { amount: number; billerCode: string; accountNumber: string }) {
    const accountId = await this.userService.resolveLedgerAccountId(userId);
    return this.ledgerProxy.forwardToGateway(
      'post',
      `/api/v1/payments/bill/utility`,
      {
        accountId,
        amount: body.amount,
        billerCode: body.billerCode,
        accountNumber: body.accountNumber,
      }
    );
  }

  async payCreditCardBill(userId: string, body: { amount: number; cardNumber: string }) {
    const accountId = await this.userService.resolveLedgerAccountId(userId);
    return this.ledgerProxy.forwardToGateway(
      'post',
      `/api/v1/payments/bill/credit-card`,
      {
        accountId,
        amount: body.amount,
        cardNumber: body.cardNumber,
      }
    );
  }

  async payMobileTopup(userId: string, body: { amount: number; phoneNumber: string }) {
    const accountId = await this.userService.resolveLedgerAccountId(userId);
    return this.ledgerProxy.forwardToGateway(
      'post',
      `/api/v1/payments/bill/mobile`,
      {
        accountId,
        amount: body.amount,
        phoneNumber: body.phoneNumber,
      }
    );
  }
}
