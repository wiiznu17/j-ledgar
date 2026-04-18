import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from '../user/user.module';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

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
        const address = configService.get<string>('JLEDGER_REDIS_ADDRESS', 'redis://localhost:6379');
        const password = configService.get<string>('JLEDGER_REDIS_PASSWORD');
        const redisOptions: any = {};
        if (password) {
          redisOptions.password = password;
        }
        return new Redis(address, redisOptions);
      },
    },
    AuthService, 
    JwtStrategy
  ],
  exports: [AuthService, REDIS_CLIENT],
})
export class AuthModule {}
