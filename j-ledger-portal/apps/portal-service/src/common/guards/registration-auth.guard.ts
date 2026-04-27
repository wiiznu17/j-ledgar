import { Injectable, UnauthorizedException, Logger, ExecutionContext } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RegistrationAuthGuard implements CanActivate {
  private readonly logger = new Logger(RegistrationAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: any): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Authorization header required');
    }

    const token = authorization.replace('Bearer ', '');

    try {
      // Try to verify as access token first
      const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload = await this.jwtService.verifyAsync(token, {
        secret: accessSecret,
      });
      request.user = payload;
      return true;
    } catch (accessError) {
      // If access token fails, try as registration token
      try {
        const registrationSecret = this.configService.get<string>('JWT_REGISTRATION_SECRET');
        const payload = await this.jwtService.verifyAsync(token, {
          secret: registrationSecret,
        });

        if (payload.typ !== 'registration') {
          throw new UnauthorizedException('Invalid token type');
        }

        request.user = payload;
        request.isRegistrationToken = true;
        return true;
      } catch (regError) {
        // Log the error for debugging
        if (regError.name === 'TokenExpiredError') {
          this.logger.warn(`[RegistrationAuthGuard] Token expired: ${regError.message}`);
          throw new UnauthorizedException('Token expired');
        }
        this.logger.warn(`[RegistrationAuthGuard] Invalid token: ${regError.message}`);
        throw new UnauthorizedException('Invalid token');
      }
    }
  }
}
