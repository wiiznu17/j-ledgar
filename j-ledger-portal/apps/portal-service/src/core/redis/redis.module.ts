import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/constants';
import { ThrottlerStorageRedisService } from './throttler-storage-redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisAddress =
          configService.get<string>('JLEDGER_REDIS_ADDRESS') ||
          'redis://localhost:6379';
        const redisPassword = configService.get<string>(
          'JLEDGER_REDIS_PASSWORD',
        );

        const redis = new Redis(redisAddress, {
          password: redisPassword || undefined,
        });

        redis.on('error', (err) => {
          console.error('Redis connection error:', err);
        });

        return redis;
      },
      inject: [ConfigService],
    },
    ThrottlerStorageRedisService,
  ],
  exports: [REDIS_CLIENT, ThrottlerStorageRedisService],
})
export class RedisModule {}

