import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InternalAuthGuard } from './guards/internal-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';

@Controller('admin/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(InternalAuthGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    console.log('[admin-auth-service] AuthController.login - Request:', JSON.stringify(loginDto));
    const result = await this.authService.loginWithEmailPassword(loginDto.email, loginDto.password);
    console.log('[admin-auth-service] AuthController.login - Response:', JSON.stringify(result));
    return result;
  }

  @UseGuards(InternalAuthGuard)
  @Post('refresh')
  async refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.authService.refreshTokens(body.userId, body.refreshToken);
  }

  @UseGuards(InternalAuthGuard)
  @Post('logout')
  async logout(@Body() body: { userId: string }) {
    return this.authService.logout(body.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
