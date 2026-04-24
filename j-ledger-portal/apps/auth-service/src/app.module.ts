import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { BiometricModule } from './biometric/biometric.module';
import { UserSettingsModule } from './settings/user-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    AuthModule,
    BiometricModule,
    UserSettingsModule,
  ],
})
export class AppModule {}
