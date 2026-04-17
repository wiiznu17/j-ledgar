import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const { email, password } = body;
    const user = await this.authService.validateUser(email, password);
    return this.authService.login(user);
  }

  @Post('verify-pin')
  async verifyPin(@Body() body: any) {
    const { email, pin } = body;
    const isValid = await this.authService.validatePinById(email, pin);
    return { valid: isValid };
  }
}
