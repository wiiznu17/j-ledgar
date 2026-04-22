import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TransferController } from './transfer.controller';
import { TransferService } from './services/transfer.service';
import { PinService } from './services/pin.service';
import { LedgerClient } from './clients/ledger.client';

/**
 * Transfer Module
 * Handles P2P transfers with security and compliance
 *
 * Exports:
 * - TransferService (for other modules)
 * - PinService (for other modules)
 *
 * Features:
 * - P2P transfers with idempotency
 * - PIN verification with lockout
 * - KYC requirement checking
 * - Maker-Checker approval workflow (high-value)
 * - Double-entry ledger integration
 * - PDPA compliance (PII tracking, PIN attempt history)
 * - AML/CFT compliance (100k THB threshold)
 */
@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [TransferController],
  providers: [TransferService, PinService, LedgerClient],
  exports: [TransferService, PinService, LedgerClient],
})
export class TransferModule {}
