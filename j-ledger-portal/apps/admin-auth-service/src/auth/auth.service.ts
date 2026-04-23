import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StaffService } from '../staff/staff.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private staffService: StaffService,
    private jwtService: JwtService,
  ) {}

  async validateStaff(username: string, password: string): Promise<any> {
    const staff = await this.staffService.findByUsername(username);
    if (!staff || !staff.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = staff;
    return result;
  }

  async login(username: string, password: string) {
    const staff = await this.validateStaff(username, password);
    if (!staff) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: staff.id, username: staff.username };
    return {
      access_token: this.jwtService.sign(payload),
      staff: {
        id: staff.id,
        username: staff.username,
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
      },
    };
  }
}
