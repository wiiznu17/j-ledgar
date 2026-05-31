import { Module, forwardRef } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [PrismaModule, forwardRef(() => IntegrationModule)],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
