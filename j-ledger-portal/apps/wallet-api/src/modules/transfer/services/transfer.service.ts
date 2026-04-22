import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateP2pTransferDto } from '../dto/create-p2p-transfer.dto';
import { TransferResponseDto, TransferApprovalPendingDto } from '../dto/transfer-response.dto';
import { PinService } from './pin.service';
import { LedgerClient } from '../clients/ledger.client';

/**
 * Transfer Service
 * Handles P2P transfer workflow with security and compliance
 *
 * Workflow:
 * 1. Validate PIN
 * 2. Check KYC status (must be APPROVED)
 * 3. Check idempotency key (prevent duplicates)
 * 4. If amount > 100k THB: Create approval pending (Maker-Checker)
 * 5. Else: Call j-ledger-core to execute transfer
 * 6. Update transfer status based on ledger response
 */
@Injectable()
export class TransferService {
  constructor(
    private prisma: PrismaService,
    private pinService: PinService,
    private ledgerClient: LedgerClient,
  ) {}

  /**
   * Create P2P Transfer
   * Implements Thailand-specific security:
   * - PIN verification
   * - KYC check (APPROVED)
   * - Idempotency key
   * - High-value Maker-Checker approval
   */
  async createP2pTransfer(
    userId: string,
    dto: CreateP2pTransferDto,
  ): Promise<TransferResponseDto | TransferApprovalPendingDto> {
    // Step 1: Check PIN
    await this.pinService.validatePin(userId, dto.pin);

    // Step 2: Verify KYC status
    const kyc = await this.prisma.kycData.findUnique({
      where: { userId },
    });

    if (!kyc || kyc.verificationStatus !== 'APPROVED') {
      throw new ForbiddenException(
        'KYC verification required. Please complete KYC before transferring.',
      );
    }

    // Step 3: Check idempotency key to prevent duplicates
    const existingTransfer = await this.prisma.transfer.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });

    if (existingTransfer) {
      // Already processed this request
      return this.mapTransferToDto(existingTransfer);
    }

    // Step 4: Resolve recipient user by phone number
    const recipientUser = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.recipientPhone },
    });

    if (!recipientUser) {
      throw new BadRequestException('Recipient not found. Please verify the phone number.');
    }

    if (recipientUser.id === userId) {
      throw new BadRequestException('Cannot transfer to your own account.');
    }

    // Step 5: Create transfer record
    const transfer = await this.prisma.transfer.create({
      data: {
        idempotencyKey: dto.idempotencyKey,
        fromUserId: userId,
        toUserId: recipientUser.id,
        amount: dto.amount,
        currency: 'THB',
        status: 'PENDING',
      },
    });

    // Step 6: Check high-value threshold (100k THB)
    const highValueThreshold = 10000000; // 100,000 THB in satoshi
    if (dto.amount > highValueThreshold) {
      // Require Maker-Checker approval (PDPA compliance)
      const approval = await this.prisma.approval.create({
        data: {
          userId,
          approvalType: 'P2P_TRANSFER',
          makerId: userId,
          status: 'PENDING',
          data: {
            transferId: transfer.id,
            amount: dto.amount,
            toUserId: recipientUser.id,
            toPhoneNumber: dto.recipientPhone,
            reason:
              'High-value transfer over 100,000 THB requires Maker-Checker approval (Thailand AML/CFT)',
          },
        },
      });

      await this.prisma.transfer.update({
        where: { id: transfer.id },
        data: { approvalId: approval.id, status: 'PENDING' },
      });

      return {
        id: transfer.id,
        approvalId: approval.id,
        status: 'PENDING_APPROVAL' as const,
        amount: dto.amount,
        message: `Transfer of ${(dto.amount / 100).toFixed(2)} THB requires admin approval (Maker-Checker workflow)`,
        createdAt: transfer.createdAt,
      };
    }

    // Step 7: Execute transfer with j-ledger-core
    try {
      const result = await this.executeTransferWithLedger(
        userId,
        recipientUser.id,
        dto.amount,
        transfer.id,
        dto.idempotencyKey,
      );

      return this.mapTransferToDto(result);
    } catch (err) {
      const error = err as any;
      // Mark transfer as failed
      await this.prisma.transfer.update({
        where: { id: transfer.id },
        data: {
          status: 'FAILED',
          failureReason: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Execute transfer with j-ledger-core
   * TODO: Implement HTTP client to call j-ledger-core API
   * POST /api/v1/transactions/transfer
   * Expects response: { id, status, amount, ... }
   */
  private async executeTransferWithLedger(
    fromUserId: string,
    toUserId: string,
    amount: number,
    transferId: string,
    idempotencyKey: string,
  ): Promise<any> {
    // Generate trace ID for distributed tracing
    const traceId = `trc-${idempotencyKey.substring(0, 8)}`;

    try {
      // Execute transfer with j-ledger-core
      // Note: In a real system, we'd map user IDs to ledger account IDs
      const result = await this.ledgerClient.executeP2pTransfer(
        idempotencyKey,
        fromUserId,
        toUserId,
        amount,
        traceId,
      );

      // Update transfer status to COMPLETED
      const transfer = await this.prisma.transfer.update({
        where: { id: transferId },
        data: {
          status: 'COMPLETED',
          ledgerTxnId: result.id,
        },
      });

      return transfer;
    } catch (err) {
      const error = err as any;
      // Log error and propagate
      console.error(`Ledger transfer failed for ${transferId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get transfer by ID
   */
  async getTransfer(transferId: string, userId: string): Promise<TransferResponseDto> {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id: transferId },
    });

    if (!transfer) {
      throw new BadRequestException('Transfer not found');
    }

    // Check authorization (user can only view their own transfers)
    if (transfer.fromUserId !== userId && transfer.toUserId !== userId) {
      throw new ForbiddenException('Not authorized to view this transfer');
    }

    return this.mapTransferToDto(transfer);
  }

  /**
   * Get user's transfer history
   */
  async getTransferHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<TransferResponseDto[]> {
    const transfers = await this.prisma.transfer.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return transfers.map((t: any) => this.mapTransferToDto(t));
  }

  /**
   * Map Transfer model to DTO
   */
  private mapTransferToDto(transfer: any): TransferResponseDto {
    return {
      id: transfer.id,
      idempotencyKey: transfer.idempotencyKey,
      fromUserId: transfer.fromUserId,
      toUserId: transfer.toUserId,
      amount: transfer.amount,
      amountTHB: transfer.amount / 100,
      currency: transfer.currency,
      status: transfer.status,
      ledgerTxnId: transfer.ledgerTxnId,
      approvalId: transfer.approvalId,
      failureReason: transfer.failureReason,
      createdAt: transfer.createdAt,
      updatedAt: transfer.updatedAt,
    };
  }
}
