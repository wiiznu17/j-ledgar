import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IdentityService } from './identity.service';
import { IdentityController } from '../../user/identity/identity.controller';
import { AwsSnsSmSProviderProvider } from '../integrations/providers/sms-provider.aws-sns';
import { JwtStrategy } from './jwt.strategy';
import { IntegrationModule } from '../integration/integration.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.CUSTOMER_JWT_SECRET;
        if (!secret || secret.length < 32) {
          throw new Error('CUSTOMER_JWT_SECRET is missing or too short');
        }
        return {
          secret: secret,
          signOptions: { expiresIn: '3m' },
        };
      },
    }),
    IntegrationModule,
    NotificationModule,
  ],
  providers: [IdentityService, AwsSnsSmSProviderProvider, JwtStrategy],
  controllers: [IdentityController],
  exports: [IdentityService],
})
export class IdentityModule {}
