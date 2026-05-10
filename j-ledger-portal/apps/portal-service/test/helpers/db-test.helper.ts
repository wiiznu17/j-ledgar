import { Logger } from '@nestjs/common';
import { PrismaService } from '../../src/core/prisma/prisma.service';

export class DbTestHelper {
  private readonly logger = new Logger(DbTestHelper.name);
  constructor(private prisma: PrismaService) {}

  async clearDatabase() {
    const tableNames = [
      'Address',
      'KYCData',
      'KYCDocument',
      'KYCUser',
      'UserSetting',
      'UserConsent',
      'SecurityEvent',
      'OtpChallenge',
      'RefreshSession',
      'UserDevice',
      'AuditLog',
      'Notification',
      'UserPoint',
      'PointHistory',
      'User',
    ];

    try {
      // Clear in order to respect foreign key constraints
      for (const tableName of tableNames) {
        const prismaModelName =
          tableName.charAt(0).toLowerCase() + tableName.slice(1);
        if (this.prisma[prismaModelName]) {
          await this.prisma[prismaModelName].deleteMany();
        }
      }
    } catch (error) {
      this.logger.error(`Error clearing database: ${error.message}`);
    }
  }

  async seedTermsAndConditions() {
    // Optional: seed mandatory T&C or settings if needed for onboarding
  }
}
