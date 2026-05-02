import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IdentityService } from './identity.service';
import { IdentityController } from '../../user/identity/identity.controller';
import { SmsProviderMockProvider } from '../integrations/providers/sms-provider.mock';
import { JwtStrategy } from './jwt.strategy';
import { IntegrationModule } from '../integration/integration.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.CUSTOMER_JWT_SECRET || 'jledger-customer-secret-dev-2024',
      signOptions: { expiresIn: '15m' },
    }),
    IntegrationModule,
    NotificationModule,
  ],
  providers: [IdentityService, SmsProviderMockProvider, JwtStrategy],
  controllers: [IdentityController],
  exports: [IdentityService],
})
export class IdentityModule {}
