import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LedgerProxyModule } from './ledger-proxy/ledger-proxy.module';
import { IdempotencyInterceptor } from './common/interceptors/idempotency.interceptor';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { HistoryModule } from './history/history.module';
import { ProxyModule } from './proxy/proxy.module';
import { Redis } from 'ioredis';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { REDIS_CLIENT } from './auth/auth.constants';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    AuthModule,
    ProxyModule,
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
            {
              name: 'pinVerify',
              ttl: config.get<number>('THROTTLE_TTL_PIN_VERIFY', 300000),
              limit: config.get<number>('THROTTLE_LIMIT_PIN_VERIFY', 5),
            },
            {
              name: 'biometricVerify',
              ttl: config.get<number>('THROTTLE_TTL_BIOMETRIC_VERIFY', 300000),
              limit: config.get<number>('THROTTLE_LIMIT_BIOMETRIC_VERIFY', 10),
            },
            {
              name: 'refreshToken',
              ttl: config.get<number>('THROTTLE_TTL_REFRESH_TOKEN', 60000),
              limit: config.get<number>('THROTTLE_LIMIT_REFRESH_TOKEN', 20),
            },
            {
              name: 'accountDeletion',
              ttl: config.get<number>('THROTTLE_TTL_ACCOUNT_DELETION', 3600000),
              limit: config.get<number>('THROTTLE_LIMIT_ACCOUNT_DELETION', 3),
            },
          ],
          storage: {
            storage: new ThrottlerStorageRedisService(redis),
            async getRecord(key: string): Promise<number[]> {
              const finalKey = key.startsWith('throttler:') ? key : `throttler:${key}`;
              return await (this as any).storage.getRecord(finalKey);
            },
            async increment(
              key: string,
              ttl: number,
              limit: number,
              blockDuration: number,
              throttlerName: string,
            ): Promise<any> {
              const currentStorage = (this as any).storage;
              const finalKey = key.startsWith('throttler:') ? key : `throttler:${key}`;
              const res = await currentStorage.increment(
                finalKey,
                ttl,
                limit,
                blockDuration,
                throttlerName,
              );

              const tLogger = new Logger('ThrottlerStorage');
              tLogger.debug(
                `[${throttlerName}] Hits: ${res.totalHits}/${limit} for key: ${finalKey}`,
              );
              return res;
            },
          } as any,
        };
      },
    }),
    LedgerProxyModule,
    HistoryModule,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
