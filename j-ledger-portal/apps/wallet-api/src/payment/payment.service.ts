import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { TopUpDto } from './dto/topup.dto';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../user/user.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly ledgerProxy: LedgerProxyService,
    private readonly userService: UserService,
  ) {}

  async initiateTopUp(userId: string, topUpDto: TopUpDto) {
    const referenceId = `TOPUP_${uuidv4().replace(/-/g, '').toUpperCase().substring(0, 12)}`;
    const accountId = await this.userService.resolveLedgerAccountId(userId);

    await this.ledgerProxy.forwardToGateway('post', '/api/v1/payments', {
      accountId,
      referenceId,
      amount: topUpDto.amount,
      type: 'TOPUP',
    });

    const qrData = `00020101021130320016A00000067701011101130006629999999995802TH53037645405${this.topUpUpAmount(topUpDto.amount)}6304MOCK_PAYLOAD_[${referenceId}]`;

    return {
      referenceId,
      amount: topUpDto.amount,
      currency: 'THB',
      status: 'PENDING',
      qrData,
      channel: topUpDto.channel,
    };
  }

  async topUpBank(userId: string, body: { amount: number; bankAccount: string }) {
    const accountId = await this.userService.resolveLedgerAccountId(userId);
    return this.ledgerProxy.forwardToGateway('post', `/api/v1/payments/topup/bank`, {
      accountId,
      amount: body.amount,
      bankAccount: body.bankAccount,
    });
  }

  async topUpCounter(userId: string, body: { amount: number; counterCode: string }) {
    const accountId = await this.userService.resolveLedgerAccountId(userId);
    return this.ledgerProxy.forwardToGateway('post', `/api/v1/payments/topup/counter`, {
      accountId,
      amount: body.amount,
      counterCode: body.counterCode,
    });
  }

  async topUpCash(userId: string, body: { amount: number; agentId: string }) {
    const accountId = await this.userService.resolveLedgerAccountId(userId);
    return this.ledgerProxy.forwardToGateway('post', `/api/v1/payments/topup/cash`, {
      accountId,
      amount: body.amount,
      agentId: body.agentId,
    });
  }

  private topUpUpAmount(amount: number): string {
    const formatted = amount.toFixed(2).replace('.', '');
    return formatted.padStart(10, '0');
  }
}
