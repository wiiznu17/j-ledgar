import { Controller, Post, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { BiometricService } from './biometric.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('biometric')
@UseGuards(JwtAuthGuard)
export class BiometricController {
  constructor(private readonly biometricService: BiometricService) {}

  @Post('enable')
  async enableBiometric(
    @Request() req,
    @Body('deviceIdentifier') deviceIdentifier: string,
    @Body('biometricData') biometricData: string,
  ) {
    return this.biometricService.enableBiometric(req.user.userId, deviceIdentifier, biometricData);
  }

  @Delete('disable')
  async disableBiometric(@Request() req) {
    return this.biometricService.disableBiometric(req.user.userId);
  }

  @Post('verify')
  async verifyBiometric(@Request() req, @Body('biometricData') biometricData: string) {
    const isValid = await this.biometricService.verifyBiometric(req.user.userId, biometricData);
    return { isValid };
  }
}
