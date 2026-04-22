import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CreateP2pTransferDto } from './dto/create-p2p-transfer.dto';
import { TransferResponseDto, TransferApprovalPendingDto } from './dto/transfer-response.dto';
import { TransferService } from './services/transfer.service';

/**
 * Transfer Controller
 * REST API endpoints for P2P transfers
 *
 * Implements Thailand-specific security:
 * - JWT authentication (JwtAuthGuard)
 * - PIN verification
 * - KYC requirement (APPROVED)
 * - High-value Maker-Checker approval workflow
 * - Idempotency key for duplicate prevention
 * - AML/CFT compliance (100k THB threshold)
 */
@ApiTags('Transfers')
@Controller('transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TransferController {
  constructor(private transferService: TransferService) {}

  /**
   * Create P2P Transfer
   *
   * POST /transfers/p2p
   *
   * Security checks:
   * 1. User must be authenticated
   * 2. PIN must be valid (3 attempts → 30 min lockout)
   * 3. KYC must be APPROVED
   * 4. Recipient phone must be registered
   * 5. Amount must be positive
   *
   * High-value workflow (> 100k THB):
   * - Creates approval record
   * - Returns PENDING_APPROVAL status
   * - Admin must approve before execution
   *
   * Idempotency:
   * - Same idempotencyKey + user = same response
   * - Prevents duplicate transfers on network retry
   */
  @Post('p2p')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create P2P Transfer',
    description: 'Transfer money between users with PIN verification and KYC requirement',
  })
  @ApiResponse({
    status: 201,
    description: 'Transfer created successfully',
    type: TransferResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid request (insufficient funds, invalid PIN, KYC not verified, recipient not found)',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (KYC not approved, account locked, authorization failed)',
  })
  async createP2pTransfer(
    @Body() dto: CreateP2pTransferDto,
    @Req() req: any,
  ): Promise<TransferResponseDto | TransferApprovalPendingDto> {
    // Validate PIN input format
    if (!dto.pin || dto.pin.length < 4 || dto.pin.length > 6) {
      throw new BadRequestException('PIN must be 4-6 digits');
    }

    // Validate phone format
    if (
      !dto.recipientPhone ||
      (!dto.recipientPhone.startsWith('+66') && !dto.recipientPhone.startsWith('0'))
    ) {
      throw new BadRequestException(
        'Phone number must be Thai format (+66xxxxxxxxx or 0xxxxxxxxx)',
      );
    }

    // Validate idempotency key
    if (!dto.idempotencyKey || dto.idempotencyKey.length === 0) {
      throw new BadRequestException('idempotencyKey is required for duplicate prevention');
    }

    return this.transferService.createP2pTransfer(req.user.id, dto);
  }

  /**
   * Get Transfer Details
   *
   * GET /transfers/:id
   *
   * Returns transfer status and details
   * User can only view their own transfers
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get Transfer Details',
    description: 'Retrieve transfer status and details',
  })
  @ApiResponse({
    status: 200,
    description: 'Transfer found',
    type: TransferResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Transfer not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to view this transfer',
  })
  async getTransfer(
    @Param('id') transferId: string,
    @Req() req: any,
  ): Promise<TransferResponseDto> {
    return this.transferService.getTransfer(transferId, req.user.id);
  }

  /**
   * Get Transfer History
   *
   * GET /transfers?limit=50&offset=0
   *
   * Returns paginated list of user's transfers
   * (both sent and received)
   */
  @Get()
  @ApiOperation({
    summary: 'Get Transfer History',
    description: 'Retrieve paginated list of user transfers (sent and received)',
  })
  @ApiResponse({
    status: 200,
    description: 'Transfer history',
    type: [TransferResponseDto],
  })
  async getTransferHistory(
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
    @Req() req: any,
  ): Promise<TransferResponseDto[]> {
    const limitNum = Math.min(parseInt(limit) || 50, 100); // Max 100 per request
    const offsetNum = parseInt(offset) || 0;

    return this.transferService.getTransferHistory(req.user.id, limitNum, offsetNum);
  }
}
