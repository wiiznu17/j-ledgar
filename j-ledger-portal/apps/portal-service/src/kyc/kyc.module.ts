import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { IntegrationModule } from '../integration/integration.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [IntegrationModule, JwtModule.register({}), ConfigModule, IdentityModule],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
