import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['admin_session'];
            console.log('[AdminJwtStrategy] Cookie admin_session found:', !!token);
          } else {
            console.log('[AdminJwtStrategy] No cookies found in request');
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('ADMIN_JWT_SECRET') ||
        'jledger-admin-super-secret-2024-dev-key-32chars',
    });
  }

  async validate(payload: any) {
    console.log('[AdminJwtStrategy] Validating payload:', payload);
    // For admin, payload.sub is staff.id
    const staff = await this.prisma.staff.findUnique({
      where: { id: payload.sub },
    });

    if (!staff) {
      console.log('[AdminJwtStrategy] Staff not found for id:', payload.sub);
      throw new UnauthorizedException();
    }

    if (!staff.isActive) {
      console.log('[AdminJwtStrategy] Staff is inactive:', payload.sub);
      throw new UnauthorizedException();
    }

    return payload;
  }
}
