import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => {
          const cookieHeader = request?.headers?.cookie;
          if (!cookieHeader) return null;
          
          const data = cookieHeader
            .split(';')
            .map((c: string) => c.trim())
            .find((c: string) => c.startsWith('admin_session='))
            ?.split('=')[1];
            
          return data || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'jledger-local-dev-jwt-secret',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
