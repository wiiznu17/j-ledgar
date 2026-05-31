import { Exclude, Expose } from 'class-transformer';
import { WalletUser } from '@repo/dto';

/**
 * Standardized User Response DTO (Backend Local)
 * 
 * Implements the shared WalletUser interface and defines 
 * security boundaries using class-transformer decorators.
 */
export class UserResponseDto implements WalletUser {
  @Expose() id!: string;
  @Expose() phoneNumber!: string;
  @Expose() email!: string | null;
  @Expose() status!: string;
  @Expose() registrationState!: string;
  @Expose() kycStatus?: string;
  @Expose() emailVerified?: boolean;
  @Expose() ledgerAccountId!: string | null;
  @Expose() loyaltyPoints?: number;
  @Expose() createdAt!: Date | string;
  @Expose() updatedAt!: Date | string;

  @Expose() profile?: any;
  @Expose() addresses?: any[];
  @Expose() kycData?: any;

  // Sensitive fields are marked as Excluded
  @Exclude() passwordHash?: string;
  @Exclude() pinHash?: string;
  @Exclude() biometricKey?: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
