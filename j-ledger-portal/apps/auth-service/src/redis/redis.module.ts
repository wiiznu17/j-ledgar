import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../auth/auth.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const redisAddress = configService.get<string>('JLEDGER_REDIS_ADDRESS') || 'redis://localhost:6379';
        const redisPassword = configService.get<string>('JLEDGER_REDIS_PASSWORD');
        
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
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
