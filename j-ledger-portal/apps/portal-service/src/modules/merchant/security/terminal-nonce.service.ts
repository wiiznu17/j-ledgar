import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../core/common/constants';

@Injectable()
export class TerminalNonceService {
  private readonly WINDOW_SECONDS = 300; // 5 minutes

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async validateNonce(
    terminalId: string,
    nonce: string,
    timestamp: string,
  ): Promise<void> {
    const ts = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);

    // 1. Validate Timestamp Window
    if (isNaN(ts) || Math.abs(now - ts) > this.WINDOW_SECONDS) {
      throw new HttpException(
        'Request timestamp outside of allowed window',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 2. Check and Set Nonce in Redis (Atomic SET NX EX)
    const nonceKey = `terminal:nonce:${terminalId}:${nonce}`;

    // SET key value NX EX seconds
    // Returns 'OK' if set, null if already exists
    const result = await this.redis.set(
      nonceKey,
      '1',
      'EX',
      this.WINDOW_SECONDS * 2,
      'NX',
    );

    if (!result) {
      throw new HttpException(
        'Duplicate nonce detected (Replay Attack)',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
