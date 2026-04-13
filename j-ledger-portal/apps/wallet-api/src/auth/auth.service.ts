import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  async validatePin(plainPin: string, hashedPin: string): Promise<boolean> {
    return bcrypt.compare(plainPin, hashedPin);
  }
}
