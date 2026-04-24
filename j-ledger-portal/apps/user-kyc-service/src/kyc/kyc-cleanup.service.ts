import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KycCleanupService {
  private readonly logger = new Logger(KycCleanupService.name);

  // Cleanup incomplete KYC data older than 7 days
  // Runs daily at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupIncompleteKYC() {
    this.logger.log('Starting cleanup of incomplete KYC data...');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
      // Find KYC data that is still PENDING and older than 7 days
      const incompleteKyc = await this.prisma.kYCData.findMany({
        where: {
          verificationStatus: 'PENDING',
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
      });

      if (incompleteKyc.length === 0) {
        this.logger.log('No incomplete KYC data found for cleanup.');
        return;
      }

      this.logger.log(`Found ${incompleteKyc.length} incomplete KYC records to clean up.`);

      // Delete incomplete KYC data
      for (const kyc of incompleteKyc) {
        try {
          // Delete KYC data
          await this.prisma.kYCData.delete({
            where: { id: kyc.id },
          });

          this.logger.log(`Deleted incomplete KYC data for user: ${kyc.userId}`);
        } catch (error) {
          this.logger.error(`Failed to delete KYC data for user ${kyc.userId}:`, error);
        }
      }

      this.logger.log('KYC cleanup completed successfully.');
    } catch (error) {
      this.logger.error('Error during KYC cleanup:', error);
    }
  }

  // Cleanup rejected KYC data older than 30 days
  // Runs weekly on Sunday at 3 AM
  @Cron('0 3 * * 0')
  async cleanupRejectedKYC() {
    this.logger.log('Starting cleanup of rejected KYC data...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      const rejectedKyc = await this.prisma.kYCData.findMany({
        where: {
          verificationStatus: 'REJECTED',
          verifiedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      if (rejectedKyc.length === 0) {
        this.logger.log('No rejected KYC data found for cleanup.');
        return;
      }

      this.logger.log(`Found ${rejectedKyc.length} rejected KYC records to clean up.`);

      for (const kyc of rejectedKyc) {
        try {
          await this.prisma.kYCData.delete({
            where: { id: kyc.id },
          });

          this.logger.log(`Deleted rejected KYC data for user: ${kyc.userId}`);
        } catch (error) {
          this.logger.error(`Failed to delete rejected KYC data for user ${kyc.userId}:`, error);
        }
      }

      this.logger.log('Rejected KYC cleanup completed successfully.');
    } catch (error) {
      this.logger.error('Error during rejected KYC cleanup:', error);
    }
  }

  constructor(private readonly prisma: PrismaService) {}
}
