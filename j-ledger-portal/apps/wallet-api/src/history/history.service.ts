import { Injectable } from '@nestjs/common';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { UserService } from '../user/user.service';

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

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

@Injectable()
export class HistoryService {
  constructor(
    private readonly ledgerProxyService: LedgerProxyService,
    private readonly userService: UserService,
  ) {}

  async getTransactionHistory(userId: string, page: number = 0, size: number = 20) {
    const accountId = await this.userService.resolveLedgerAccountId(userId);

    const historyResponse = await this.ledgerProxyService.forwardToGateway<PaginatedResponse<LedgerEntry>>(
      'get', 
      `/api/v1/accounts/${accountId}/transactions?page=${page}&size=${size}`
    );
    
    const formattedData = historyResponse.content.map((entry: LedgerEntry) => {
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
        currentPage: historyResponse.number,
        totalPages: historyResponse.totalPages,
        totalItems: historyResponse.totalElements,
      }
    };
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
