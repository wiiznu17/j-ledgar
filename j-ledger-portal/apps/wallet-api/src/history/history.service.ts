import { Injectable } from '@nestjs/common';
import { TransactionProxyService } from '../proxy/transaction-proxy.service';

type LedgerEntryType = 'DEBIT' | 'CREDIT';
type TransactionType = 'TOPUP' | 'TRANSFER' | 'PAYMENT';

interface LedgerEntry {
  id: string;
  amount: number;
  entryType: LedgerEntryType;
  createdAt: string;
  transaction?: {
    id: string;
    status?: string;
    transactionType?: TransactionType;
  };
}

@Injectable()
export class HistoryService {
  constructor(private readonly transactionProxyService: TransactionProxyService) {}

  async getTransactionHistory(userId: string, page: number = 0, size: number = 20) {
    const historyResponse = await this.transactionProxyService.getTransactionHistory(userId, {});

    const formattedData = historyResponse.map((entry: LedgerEntry) => {
      return {
        id: entry.id,
        amount: entry.amount,
        type: entry.entryType,
        date: entry.createdAt,
        title: this.generateTransactionTitle(entry),
        status: entry.transaction?.status,
        reference: entry.transaction?.id,
      };
    });

    return {
      data: formattedData,
      meta: {
        currentPage: page,
        totalPages: Math.ceil((formattedData.length || 0) / size),
        totalItems: formattedData.length || 0,
      },
    };
  }

  async getTransactionDetails(transactionId: string) {
    const transactionResponse = await this.transactionProxyService.getTransactionDetails(
      transactionId,
      {},
    );

    return transactionResponse;
  }

  private generateTransactionTitle(entry: LedgerEntry): string {
    const txnType = entry.transaction?.transactionType;
    const isCredit = entry.entryType === 'CREDIT';

    if (!txnType) {
      return 'ธุรกรรมอื่นๆ';
    }

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
