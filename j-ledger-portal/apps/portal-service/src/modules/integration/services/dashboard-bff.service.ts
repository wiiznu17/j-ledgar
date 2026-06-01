import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { FinanceService } from '../../../core/finance/finance.service';
import { LoyaltyService } from '../../loyalty/loyalty.service';
import { BannerService } from '../../banners/banner.service';
import { TransactionHistoryService } from './transaction-history.service';

@Injectable()
export class DashboardBffService {
  private readonly logger = new Logger(DashboardBffService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    private readonly loyaltyService: LoyaltyService,
    private readonly bannerService: BannerService,
    private readonly historyService: TransactionHistoryService,
  ) {}

  async getDashboardData(userId: string) {
    this.logger.log(`[Dashboard] Fetching dashboard data for user ${userId}`);

    const [kycData, wallet, transactions, userPoint, banners] =
      await Promise.all([
        this.prisma.kYCData.findUnique({ where: { userId } }).catch(() => null),
        this.financeService.getWallet(userId).catch(() => null),
        this.financeService.getTransactions(userId).catch(() => []),
        this.loyaltyService
          .getUserBalance(userId)
          .catch(() => ({ balance: 0 })),
        this.bannerService.getActiveBanners().catch(() => []),
      ]);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const userWalletId = wallet?.walletId;

    const recentTransactions = (transactions || [])
      .slice(0, 10)
      .map((tx: any) =>
        this.historyService.mapWalletTransactionToHistoryItem(tx, userWalletId, wallet?.id),
      );

    return {
      user: {
        id: userId,
        name: kycData?.idCardName || 'J-Ledger User',
        kycStatus: kycData?.verificationStatus || 'NOT_STARTED',
        points: userPoint?.balance || 0,
        idCardNumber: kycData?.idCardNumber || null,
        birthDate: kycData?.dateOfBirth
          ? kycData.dateOfBirth.toISOString()
          : kycData
            ? '2003-11-17T00:00:00Z'
            : null,
        phone: user?.phoneNumber || null,
      },
      wallet: wallet
        ? {
            balance: wallet.balance || 0,
            currency: wallet.currency || 'THB',
            status: wallet.status || 'ACTIVE',
            walletId: wallet.walletId,
          }
        : null,
      banners,
      recentTransactions,
    };
  }

  async getLinkedBankAccounts(userId: string) {
    const accounts = await this.financeService.getLinkedBankAccounts(userId);
    return (accounts || []).map((account: any) => ({
      id: account.id,
      bankCode: account.bankCode,
      bankName: account.bankName,
      accountNumberMasked: account.accountNumber,
      accountName: account.accountName,
      accountType: account.accountType,
      isDefault: account.isDefault,
      isVerified: account.isVerified,
    }));
  }

  async topUp(userId: string, amount: number, bankAccountId: number) {
    if (!amount || amount <= 0) {
      throw new HttpException(
        { message: 'Invalid top-up amount' },
        HttpStatus.BAD_REQUEST,
      );
    }
    const tx = await this.financeService.topUp(userId, amount, bankAccountId);

    const bankAccounts =
      await this.financeService.getLinkedBankAccounts(userId);
    const linkedBank = bankAccounts.find(
      (account: any) => account.id === bankAccountId,
    );

    return {
      transactionId: tx.transactionId || tx.id?.toString(),
      amount: tx.amount,
      status: tx.status,
      createdAt: tx.createdAt,
      bankName: linkedBank?.bankName || null,
      accountNumberMasked: linkedBank?.accountNumber || null,
      metadata: tx.metadata || null,
    };
  }
}
