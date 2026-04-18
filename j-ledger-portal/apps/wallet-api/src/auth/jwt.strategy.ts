import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from './auth.constants';
import Redis from 'ioredis';

interface AccessJwtPayload {
  sub: string;
  sid: string;
  did: string;
  typ: 'access' | 'refresh' | 'registration';
  jti: string;
  scope?: string;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    const accessSecret = configService.get<string>('JWT_ACCESS_SECRET');
    if (!accessSecret) {
      throw new Error('Missing required environment variable: JWT_ACCESS_SECRET');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessSecret,
    });
  }

  async validate(payload: AccessJwtPayload) {
    if (payload.typ !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    try {
      const isRevoked = await this.redis.get(`denylist:jti:${payload.jti}`);
      if (isRevoked) {
        throw new UnauthorizedException('SESSION_REVOKED');
      }
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      // Fail-closed policy: if Redis is unreachable, reject the authentication
      throw new UnauthorizedException('SESSION_VALIDATION_FAILED');
    }

    return {
      sub: payload.sub,
      sid: payload.sid,
      did: payload.did,
      jti: payload.jti,
      exp: payload.exp,
      scope: payload.scope,
      typ: payload.typ,
    };
  }
}
