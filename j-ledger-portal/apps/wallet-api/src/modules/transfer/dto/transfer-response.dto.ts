import { TransferStatus } from '@prisma/client-wallet';

/**
 * Response DTO for P2P Transfer
 * Returns transfer details with current status
 */
export class TransferResponseDto {
  id!: string;
  idempotencyKey!: string;
  fromUserId!: string;
  toUserId!: string;
  amount!: number; // In satoshi equivalent
  amountTHB!: number; // For mapping consistency
  currency!: string;
  status!: TransferStatus;
  ledgerTxnId?: string; // j-ledger-core transaction ID
  approvalId?: string; // If waiting for Maker-Checker approval
  failureReason?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * Response for high-value transfer requiring approval
 */
export class TransferApprovalPendingDto {
  id!: string;
  approvalId!: string;
  status!: 'PENDING_APPROVAL';
  amount!: number;
  message!: string; // "Transfer requires admin approval (Maker-Checker)"
  createdAt!: Date;
}

/**
 * Error response for transfer failures
 */
export class TransferErrorDto {
  code!: string; // INSUFFICIENT_FUNDS, KYC_NOT_VERIFIED, PIN_INVALID, etc.
  message!: string;
  timestamp!: Date;
}
