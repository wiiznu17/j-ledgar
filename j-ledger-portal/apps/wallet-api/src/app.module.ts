import { Logger, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LedgerProxyModule } from './ledger-proxy/ledger-proxy.module';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { UserModule } from './user/user.module';
import { TransactionModule } from './transaction/transaction.module';
import { PaymentModule } from './payment/payment.module';
import { MerchantModule } from './merchant/merchant.module';
import { HistoryModule } from './history/history.module';
import { KycModule } from './kyc/kyc.module';
import { OutboxModule } from './outbox/outbox.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { Redis } from 'ioredis';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { REDIS_CLIENT } from './auth/auth.constants';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    ThrottlerModule.forRootAsync({
      imports: [AuthModule],
      inject: [ConfigService, REDIS_CLIENT],
      useFactory: (config: ConfigService, redis: Redis) => {
        const logger = new Logger('ThrottlerRedis');
        logger.log('--- INITIALIZING THROTTLER WITH SHARED REDIS ---');

        return {
          throttlers: [
            {
              name: 'default',
              ttl: config.get<number>('THROTTLE_TTL_DEFAULT', 60000),
              limit: config.get<number>('THROTTLE_LIMIT_DEFAULT', 100),
            },
            {
              name: 'regInit',
              ttl: config.get<number>('THROTTLE_TTL_REG_INIT', 300000),
              limit: config.get<number>('THROTTLE_LIMIT_REG_INIT', 10),
            },
            {
              name: 'regVerify',
              ttl: config.get<number>('THROTTLE_TTL_REG_VERIFY', 180000),
              limit: config.get<number>('THROTTLE_LIMIT_REG_VERIFY', 10),
            },
            {
              name: 'login',
              ttl: config.get<number>('THROTTLE_TTL_LOGIN', 900000),
              limit: config.get<number>('THROTTLE_LIMIT_LOGIN', 10),
            },
          ],
          storage: {
            storage: new ThrottlerStorageRedisService(redis),
            async getRecord(key: string): Promise<number[]> {
              const finalKey = key.startsWith('throttler:') ? key : `throttler:${key}`;
              return await (this as any).storage.getRecord(finalKey);
            },
            async increment(key: string, ttl: number, limit: number, blockDuration: number, throttlerName: string): Promise<any> {
              const currentStorage = (this as any).storage;
              const finalKey = key.startsWith('throttler:') ? key : `throttler:${key}`;
              const res = await currentStorage.increment(finalKey, ttl, limit, blockDuration, throttlerName);
              
              const tLogger = new Logger('ThrottlerStorage');
              tLogger.debug(`[${throttlerName}] Hits: ${res.totalHits}/${limit} for key: ${finalKey}`);
              return res;
            }
          } as any,
        };
      },
    }),
    LedgerProxyModule,
    UserModule,
    TransactionModule,
    PaymentModule,
    MerchantModule,
    HistoryModule,
    KycModule,
    OutboxModule,
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
})
export class AppModule {}
