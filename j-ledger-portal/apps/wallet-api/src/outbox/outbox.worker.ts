import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { Prisma } from '@prisma/client-wallet';

@Injectable()
export class OutboxWorker {
  private readonly logger = new Logger(OutboxWorker.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerProxy: LedgerProxyService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processOutbox() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // 1. Fetch pending events with row-level lock (Concurrency Safe)
      // Using skip locked to allow multiple workers in the future
      const events = await this.prisma.$queryRaw<any[]>`
        SELECT * FROM "wallet_schema"."ledger_outbox" 
        WHERE "status" = 'PENDING' AND "nextRetryAt" <= NOW()
        ORDER BY "createdAt" ASC
        LIMIT 10
        FOR UPDATE SKIP LOCKED;
      `;

      if (!events || events.length === 0) {
        this.isProcessing = false;
        return;
      }

      this.logger.log(`Found ${events.length} pending outbox events.`);

      for (const event of events) {
        try {
          if (event.eventType === 'CREATE_LEDGER_ACCOUNT') {
            await this.handleCreateLedgerAccount(event);
          } else {
            this.logger.warn(`Unknown event type: ${event.eventType}`);
            await this.markAsFailed(event, 'Unknown event type');
          }
        } catch (error: any) {
          this.logger.error(`Failed to process event ${event.id}: ${error.message}`);
          await this.markAsFailed(event, error.message);
        }
      }
    } catch (error: any) {
      this.logger.error('Error polling outbox events', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async handleCreateLedgerAccount(event: any) {
    const payload = event.payload;
    const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
    
    // Issue API call to core-service via proxy
    await this.ledgerProxy.forwardToGateway('post', '/api/core/accounts', {
      accountId: data.accountId,
      currency: 'THB',
    });

    // Mark as PROCESSED
    await this.prisma.$executeRaw`
      UPDATE "wallet_schema"."ledger_outbox" 
      SET "status" = 'PROCESSED', "updatedAt" = NOW()
      WHERE "id" = ${event.id}
    `;

    this.logger.log(`[OutboxWorker] Successfully created ledger account for ${data.accountId}`);
  }

  private async markAsFailed(event: any, errorMessage: string) {
    const maxRetries = 5;
    const retryCount = event.retryCount + 1;
    const status = retryCount >= maxRetries ? 'DEAD' : 'PENDING';
    
    // Exponential backoff: 2^retryCount * 10 seconds
    const backoffSeconds = Math.pow(2, retryCount) * 10;

    await this.prisma.$executeRaw`
      UPDATE "wallet_schema"."ledger_outbox" 
      SET 
        "status" = ${status}, 
        "retryCount" = ${retryCount},
        "lastError" = ${errorMessage},
        "nextRetryAt" = NOW() + (${backoffSeconds}::text || ' seconds')::interval,
        "updatedAt" = NOW()
      WHERE "id" = ${event.id}
    `;

    if (status === 'DEAD') {
      this.logger.error(`[OutboxWorker] Event ${event.id} marked as DEAD`);
    }
  }
}
