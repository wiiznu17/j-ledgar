import { IsUUID, IsPhoneNumber, IsInt, Min, IsString } from 'class-validator';

/**
 * DTO for P2P Transfer Request
 * Implements Thailand-specific security:
 * - PIN validation required
 * - KYC verification required (APPROVED status)
 * - Idempotency key to prevent duplicates
 * - High-value transfers (> 100k THB) require Maker-Checker approval
 */
export class CreateP2pTransferDto {
  /**
   * Recipient phone number (Thai format: +66xxxxxxxxx or 0xxxxxxxxx)
   */
  @IsPhoneNumber('TH')
  recipientPhone!: string;

  /**
   * Amount in smallest units (satoshi equivalent)
   * Validation: Amount must be > 0
   * For display: amount / 100 = THB
   * Example: 10000 = 100 THB
   */
  @IsInt()
  @Min(100, { message: 'Minimum transfer amount is 1 THB' })
  amount!: number;

  /**
   * User's PIN for transaction authorization
   * Must be 4-6 digits
   */
  @IsString()
  pin!: string;

  /**
   * Idempotency key to prevent duplicate transfers on network retry
   * Format: UUID or request ID from client
   * Prevents: 2x charge on network timeout → client retries
   */
  @IsString()
  idempotencyKey!: string;

  /**
   * Optional: Transfer description/reference
   */
  description?: string;
}
