import { Module } from '@nestjs/common';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LedgerProxyModule } from '../ledger-proxy/ledger-proxy.module';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, LedgerProxyModule, UserModule, AuthModule],
  controllers: [MerchantController],
  providers: [MerchantService],
})
export class MerchantModule {}
