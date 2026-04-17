import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { TopUpDto } from './dto/topup.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  constructor(private readonly ledgerProxy: LedgerProxyService) {}

  async initiateTopUp(userId: string, topUpDto: TopUpDto) {
    const referenceId = `TOPUP_${uuidv4().replace(/-/g, '').toUpperCase().substring(0, 12)}`;
    
    // 1. Register PENDING transaction in Java Core
    await this.ledgerProxy.forwardToGateway(
      'post',
      '/api/v1/payments',
      {
        accountId: topUpDto.accountId,
        referenceId,
        amount: topUpDto.amount,
        type: 'TOPUP',
      }
    );

    // 2. Generate Mock PromptPay Payload
    // Format: 000201010211...MOCK_PROMPTPAY_PAYLOAD_[referenceId]
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

  private topUpUpAmount(amount: number): string {
    const formatted = amount.toFixed(2).replace('.', '');
    return formatted.padStart(10, '0');
  }
}
