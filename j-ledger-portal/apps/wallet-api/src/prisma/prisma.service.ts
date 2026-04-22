import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client-wallet';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();

    // Enforce partial unique constraint for TRUSTED devices
    try {
      await this.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS ux_user_one_trusted_device 
        ON wallet_schema.user_devices ("userId") 
        WHERE "trustLevel" = 'TRUSTED';
      `);
      this.logger.log('Partial unique index ux_user_one_trusted_device verified.');
    } catch (error) {
      this.logger.error('Failed to create partial unique index', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
