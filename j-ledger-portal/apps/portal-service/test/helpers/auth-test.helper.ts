import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export class AuthTestHelper {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async generateRegistrationToken(userId: string, state: string) {
    const secret = this.configService.get<string>(
      'CUSTOMER_REGISTRATION_SECRET',
    );
    const payload = {
      sub: userId,
      state,
      typ: 'registration',
      nonce: uuidv4(),
    };

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '1h',
    });
  }

  async generateAccessToken(userId: string) {
    const secret = this.configService.get<string>('CUSTOMER_JWT_SECRET');
    const payload = {
      sub: userId,
      typ: 'access',
      jti: uuidv4(),
      scope: 'wallet',
    };

    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: '1h',
    });
  }
}
