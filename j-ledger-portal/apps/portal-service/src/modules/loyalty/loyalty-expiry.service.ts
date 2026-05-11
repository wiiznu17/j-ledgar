import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoyaltyService } from './loyalty.service';

@Injectable()
export class LoyaltyExpiryService {
  private readonly logger = new Logger(LoyaltyExpiryService.name);

  constructor(private readonly loyaltyService: LoyaltyService) {}

  /**
   * Cron Job to process expired points.
   * Runs every day at midnight to ensure timely expiry.
   * In production, this can be tuned to run less frequently if needed.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePointExpiry() {
    this.logger.log('Starting daily loyalty points expiry check...');
    try {
      const result = await this.loyaltyService.processExpiries();
      this.logger.log(`Loyalty points expiry check completed. Users processed: ${result.usersProcessed}, Total points expired: ${result.totalPointsExpired}`);
    } catch (error) {
      this.logger.error('Error during loyalty points expiry check:', error);
    }
  }
}
