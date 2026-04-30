import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IdentityService } from './identity.service';
import { IdentityController } from './identity.controller';
import { SmsProviderMockProvider } from '../integrations/providers/sms-provider.mock';
import { JwtStrategy } from './jwt.strategy';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET || 'default_access_secret',
      signOptions: { expiresIn: '15m' },
    }),
    IntegrationModule,
  ],
  providers: [IdentityService, SmsProviderMockProvider, JwtStrategy],
  controllers: [IdentityController],
  exports: [IdentityService],
})
export class IdentityModule {}
