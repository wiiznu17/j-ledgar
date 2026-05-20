import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('CUSTOMER_JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log(
      `[JwtStrategy] Validating payload for sub: ${payload.sub}, typ: ${payload.typ}`,
    );

    // Ensure user still exists
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      console.warn(
        `[JwtStrategy] User not found in DB for sub: ${payload.sub}`,
      );
      throw new UnauthorizedException();
    }

    // Return the JWT payload so that req.user matches AuthenticatedRequest
    return payload;
  }
}
