import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { ScanPayDto } from './dto/scan-pay.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MerchantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerProxy: LedgerProxyService,
  ) {}

  async processScanPay(accountId: string, dto: ScanPayDto) {
    const merchant = await this.prisma.merchantProfile.findUnique({
      where: { qrCodeData: dto.qrCodeData },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found for this QR code');
    }

    const idempotencyKey = uuidv4();

    const response = await this.ledgerProxy.forwardToGateway(
      'post',
      '/api/v1/transactions/merchant-pay',
      {
        fromAccountId: accountId,
        merchantAccountId: merchant.merchantAccountId,
        amount: dto.amount,
        currency: 'THB',
      },
      accountId,
      { 'Idempotency-Key': idempotencyKey },
    );

    return {
      success: true,
      transactionId: response.id,
      storeName: merchant.storeName,
      amount: dto.amount,
      pointsAwarded: dto.amount * 0.01,
    };
  }
}
