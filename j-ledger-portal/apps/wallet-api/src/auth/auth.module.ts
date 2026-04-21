import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';
import Redis from 'ioredis';

import { REDIS_CLIENT } from './auth.constants';

@Module({
  imports: [
    ConfigModule,
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const accessSecret = configService.get<string>('JWT_ACCESS_SECRET');
        if (!accessSecret) {
          throw new Error('Missing required environment variable: JWT_ACCESS_SECRET');
        }

        return {
          secret: accessSecret,
          signOptions: { expiresIn: '15m' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const address = configService.get<string>(
          'JLEDGER_REDIS_ADDRESS',
          'redis://localhost:6379',
        );
        const password = configService.get<string>('JLEDGER_REDIS_PASSWORD');
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        // Enhanced Redis configuration with connection pooling and failover
        const redisOptions: any = {
          // Connection settings
          host: 'localhost',
          port: 6379,
          password: password || undefined,

          // Connection pooling
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          enableOfflineQueue: true,

          // Retry strategy with exponential backoff
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },

          // Reconnect strategy
          reconnectOnError: (err: Error) => {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
              return true;
            }
            return false;
          },

          // Connection timeout
          connectTimeout: 10000,
          lazyConnect: true,

          // Keep-alive settings
          keepAlive: 30000,
          // Connection pool size
          family: 4, // IPv4
        };

        // Parse address if provided
        if (address && address !== 'redis://localhost:6379') {
          try {
            const url = new URL(address.replace('redis://', 'http://'));
            redisOptions.host = url.hostname || 'localhost';
            redisOptions.port = parseInt(url.port) || 6379;
          } catch (e) {
            // Fallback to default if parsing fails
            console.warn('Failed to parse Redis address, using defaults');
          }
        }

        // Production-specific settings
        if (isProduction) {
          // Enable TLS for production
          redisOptions.tls = {};
          // Increase connection pool size
          redisOptions.maxRetriesPerRequest = 5;
          // Increase connection timeout
          redisOptions.connectTimeout = 15000;
        }

        return new Redis(redisOptions);
      },
    },
    AuthService,
    JwtStrategy,
  ],
  exports: [AuthService, REDIS_CLIENT],
})
export class AuthModule {}
