import { Injectable, Inject, OnApplicationShutdown, Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { REDIS_CLIENT } from '../common/constants';
import Redis from 'ioredis';

@Injectable()
export class ThrottlerStorageRedisService implements ThrottlerStorage, OnApplicationShutdown {
  private readonly logger = new Logger(ThrottlerStorageRedisService.name);
  private readonly fallbackStorage = new ThrottlerStorageService();

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    // Check if Redis client is fully functional (prevent failure when mocked in tests)
    if (!this.redis || typeof this.redis.pttl !== 'function' || typeof this.redis.incr !== 'function') {
      this.logger.debug(
        'Redis client is mocked or missing required methods (pttl/incr). Falling back to in-memory throttling.',
      );
      return this.fallbackStorage.increment(key, ttl, limit, blockDuration, throttlerName);
    }

    const hitsKey = `throttler:${key}:${throttlerName}`;
    const blockedKey = `throttler:${key}:${throttlerName}:blocked`;

    try {
      // 1. Check if user is already blocked
      const blockedTtlMs = await this.redis.pttl(blockedKey);
      if (blockedTtlMs > 0) {
        const timeToBlockExpire = Math.ceil(blockedTtlMs / 1000);
        return {
          totalHits: limit + 1,
          timeToExpire: timeToBlockExpire,
          isBlocked: true,
          timeToBlockExpire,
        };
      }

      // 2. Increment request hits count
      const rawHits = await this.redis.incr(hitsKey);
      if (rawHits === 1) {
        await this.redis.pexpire(hitsKey, ttl);
      }

      const timeToExpireMs = await this.redis.pttl(hitsKey);
      const timeToExpire = timeToExpireMs > 0 ? Math.ceil(timeToExpireMs / 1000) : 0;

      // 3. Check if rate limit exceeded
      if (rawHits > limit) {
        // Block the user for the blockDuration
        await this.redis.set(blockedKey, '1', 'PX', blockDuration);
        const timeToBlockExpire = Math.ceil(blockDuration / 1000);
        return {
          totalHits: rawHits,
          timeToExpire,
          isBlocked: true,
          timeToBlockExpire,
        };
      }

      return {
        totalHits: rawHits,
        timeToExpire,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch (error) {
      this.logger.error(`Redis throttler error: ${error.message}. Falling back to in-memory throttling.`);
      return this.fallbackStorage.increment(key, ttl, limit, blockDuration, throttlerName);
    }
  }

  onApplicationShutdown() {
    this.fallbackStorage.onApplicationShutdown();
  }
}
