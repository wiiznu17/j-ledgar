import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { WalletUser } from '@repo/dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<WalletUser, 'createdAt'>> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, transactionPin, ...result } = user;
      return result as unknown as Omit<WalletUser, 'createdAt'>;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: Omit<WalletUser, 'createdAt'>) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validatePinByUserId(userId: string, pin: string): Promise<boolean> {
    const user = await this.userService.findById(userId);
    if (!user || !user.transactionPin) {
      throw new UnauthorizedException('PIN not set');
    }

    const isValid = await bcrypt.compare(pin, user.transactionPin);
    return isValid;
  }
}
