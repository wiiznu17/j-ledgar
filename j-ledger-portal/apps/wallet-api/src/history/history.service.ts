import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerEntry, PaginatedResponse, TransactionType, LedgerEntryType } from '@repo/dto';

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
    const historyResponse = await this.ledgerProxyService.forwardToGateway<PaginatedResponse<LedgerEntry>>(
      'get', 
      `/api/v1/accounts/${accountId}/transactions?page=${page}&size=${size}`
    );
    
    // 3. Transform Data
    const formattedData = historyResponse.content.map((entry: LedgerEntry) => {
      return {
        id: entry.id,
        amount: entry.amount,
        type: entry.entryType, // DEBIT หรือ CREDIT
        date: entry.createdAt,
        title: this.generateTransactionTitle(entry),
        status: entry.transaction?.status,
        reference: entry.transaction?.id, // Using transaction ID as fallback if idempotencyKey not expose
      };
    });

    return {
      data: formattedData,
      meta: {
        currentPage: historyResponse.number,
        totalPages: historyResponse.totalPages,
        totalItems: historyResponse.totalElements,
      }
    };
  }

  private generateTransactionTitle(entry: LedgerEntry): string {
    const txnType = entry.transaction?.transactionType; // TOPUP, TRANSFER, PAYMENT
    const isCredit = entry.entryType === LedgerEntryType.CREDIT;

    if (!txnType) {
      return 'ธุรกรรมอื่นๆ';
    }

    switch (txnType) {
      case TransactionType.TOPUP:
        return 'เติมเงินเข้าบัญชี';
      case TransactionType.PAYMENT:
        return 'ชำระเงินร้านค้า';
      case TransactionType.TRANSFER:
        return isCredit ? 'รับเงินโอน' : 'โอนเงินออก';
      default:
        return 'ธุรกรรมอื่นๆ';
    }
  }
}
