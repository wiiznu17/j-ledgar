import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { IStorageProvider } from '../../integrations/interfaces/storage-provider.interface';
import { RegistrationState } from '@prisma/client-wallet';

@Injectable()
export class KycCleanupTask {
  private readonly logger = new Logger(KycCleanupTask.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(IStorageProvider) private readonly storageProvider: IStorageProvider,
  ) {}

  /**
   * Runs every 24 hours to clean up incomplete registrations.
   * Logic: Find users who started registration > 24h ago but haven't COMPLETED.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanup() {
    this.logger.log('Starting 24h E-KYC Cleanup Job...');

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find incomplete KYC records older than 24h
    const staleKyc = await this.prisma.kycData.findMany({
      where: {
        updatedAt: { lt: twentyFourHoursAgo },
        user: {
          registrationState: { not: RegistrationState.COMPLETED },
        },
      },
      include: {
        user: true,
      },
    });

    if (staleKyc.length === 0) {
      this.logger.log('No stale KYC records found for cleanup.');
      return;
    }

    this.logger.log(`Found ${staleKyc.length} stale KYC records to process.`);

    for (const record of staleKyc) {
      try {
        // 1. Delete files from Storage (Originals and Snippets)
        if (record.idCardImageUrl) {
          await this.storageProvider.deleteFile!(record.idCardImageUrl);
        }
        if (record.selfieImageUrl) {
          await this.storageProvider.deleteFile!(record.selfieImageUrl);
        }

        // 2. Clear sensitive data from DB
        await this.prisma.$transaction(async (tx) => {
          await tx.kycData.update({
            where: { id: record.id },
            data: {
              idCardNumberEncrypted: null,
              idCardName: null,
              idCardToken: null,
              idCardImageUrl: null,
              selfieImageUrl: null,
              livenessSessionId: null,
              reviewNote: 'PII deleted due to registration expiry (24h)',
            },
          });

          // 3. Create Audit Log
          await tx.securityLog.create({
            data: {
              userId: record.userId,
              eventType: 'KYC_PII_CLEANUP_EXPIRY',
              metadata: {
                reason: 'Registration not completed within 24 hours',
                lastState: record.user.registrationState,
                kycId: record.id,
              },
            },
          });
        });

        this.logger.log(`Successfully cleaned up KYC for User: ${record.userId}`);
      } catch (error: any) {
        this.logger.error(`Failed to cleanup KYC for User: ${record.userId}: ${error.message}`);
      }
    }

    this.logger.log('KYC Cleanup Job completed.');
  }
}
