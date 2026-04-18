import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistoryService {
  constructor(
    private readonly ledgerProxyService: LedgerProxyService,
    private readonly prisma: PrismaService,
  ) {}

  async getTransactionHistory(userId: string, page: number = 0, size: number = 20) {
    // 1. หา accountId จาก userId ก่อน
    const accountResponse = await this.ledgerProxyService.getAccountByUserId(userId);
    const accountId = accountResponse.data.id;

    // 2. ดึงประวัติจาก Java Core
    const historyResponse = await this.ledgerProxyService.get(`/api/v1/accounts/${accountId}/transactions?page=${page}&size=${size}`);
    
    // 3. Transform Data
    const formattedData = historyResponse.data.content.map((entry: any) => {
      return {
        id: entry.id,
        amount: entry.amount,
        type: entry.entryType, // DEBIT หรือ CREDIT
        date: entry.createdAt,
        title: this.generateTransactionTitle(entry),
        status: entry.transaction.status,
        reference: entry.transaction.idempotencyKey,
      };
    });

    return {
      data: formattedData,
      meta: {
        currentPage: historyResponse.data.number,
        totalPages: historyResponse.data.totalPages,
        totalItems: historyResponse.data.totalElements,
      }
    };
  }

  private generateTransactionTitle(entry: any): string {
    const txnType = entry.transaction.transactionType; // TOPUP, TRANSFER, PAYMENT
    const isCredit = entry.entryType === 'CREDIT';

    switch (txnType) {
      case 'TOPUP':
        return 'เติมเงินเข้าบัญชี';
      case 'PAYMENT':
        return 'ชำระเงินร้านค้า';
      case 'TRANSFER':
        return isCredit ? 'รับเงินโอน' : 'โอนเงินออก';
      default:
        return 'ธุรกรรมอื่นๆ';
    }
  }
}
