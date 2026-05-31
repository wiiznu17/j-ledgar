import { Exclude, Expose } from 'class-transformer';
import { Transaction, Account, WalletDto, TransactionType, TransactionStatus, AccountStatus } from '@repo/dto';

/**
 * Standardized Transaction Response DTO
 */
export class TransactionResponseDto implements Transaction {
  @Expose() id!: string | number;
  @Expose() transactionId?: string;
  @Expose() transactionType!: TransactionType;
  @Expose() amount!: number;
  @Expose() fee?: number;
  @Expose() currency!: string;
  @Expose() status!: TransactionStatus;
  @Expose() createdAt!: string;
  @Expose() updatedAt?: string;
  @Expose() completedAt?: string | null;
  @Expose() description?: string;
  @Expose() senderId?: string;
  @Expose() receiverId?: string;
  @Expose() fromWalletId?: number | null;
  @Expose() toWalletId?: number | null;
  @Expose() idempotencyKey?: string;
  @Expose() reference?: string;

  // Metadata often contains internal tracking data, exclude by default
  @Exclude() metadata?: any;

  constructor(partial: Partial<TransactionResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Standardized Account Response DTO
 */
export class AccountResponseDto implements Account {
  @Expose() id!: string;
  @Expose() userId!: string;
  @Expose() accountName!: string;
  @Expose() balance!: number;
  @Expose() currency!: string;
  @Expose() status!: AccountStatus;
  @Expose() createdAt!: string;
  @Expose() updatedAt!: string;

  constructor(partial: Partial<AccountResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Standardized Wallet Response DTO
 */
export class WalletResponseDto implements WalletDto {
  @Expose() id!: number;
  @Expose() userId!: string;
  @Expose() walletId!: string;
  @Expose() balance!: number;
  @Expose() currency!: string;
  @Expose() status!: string;
  @Expose() dailyLimit!: number;
  @Expose() monthlyLimit!: number;
  @Expose() createdAt!: string;
  @Expose() updatedAt!: string;

  constructor(partial: Partial<WalletResponseDto>) {
    Object.assign(this, partial);
  }
}
