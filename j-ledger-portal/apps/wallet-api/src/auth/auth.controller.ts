import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  async login(@Body() body: any) {
    const { email, password } = body;
    const user = await this.authService.validateUser(email, password);
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('pin/setup')
  async setupPin(@Body() body: any, @Request() req: any) {
    const { pin } = body;
    const userId = req.user.sub;
    await this.userService.updatePin(userId, pin);
    return { message: 'PIN setup successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('device/bind')
  async bindDevice(@Body() body: any, @Request() req: any) {
    const { deviceId } = body;
    const userId = req.user.sub;
    await this.userService.bindDevice(userId, deviceId);
    return { message: 'Device bound successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-pin')
  async verifyPin(@Body() body: any, @Request() req: any) {
    const { pin } = body;
    const userId = req.user.sub;
    const isValid = await this.authService.validatePinByUserId(userId, pin);
    return { valid: isValid };
  }
}
