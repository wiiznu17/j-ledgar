import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes, createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BiometricService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async enableBiometric(userId: string, deviceIdentifier: string, biometricData: string) {
    // Verify device is trusted
    const device = await this.prisma.userDevice.findUnique({
      where: {
        userId_deviceIdentifier: {
          userId,
          deviceIdentifier,
        },
      },
    });

    if (!device || device.trustLevel !== 'TRUSTED') {
      throw new BadRequestException('Device must be trusted before enabling biometric');
    }

    // Encrypt biometric data
    const encryptedKey = this.encryptBiometricData(biometricData);

    // Update user with biometric key
    await this.prisma.user.update({
      where: { id: userId },
      data: { biometricKey: encryptedKey },
    });

    // Log security event
    await this.prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'BIOMETRIC_ENABLED',
        metadata: { deviceIdentifier },
      },
    });

    return { success: true };
  }

  async disableBiometric(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { biometricKey: null },
    });

    await this.prisma.securityEvent.create({
      data: {
        userId,
        eventType: 'BIOMETRIC_DISABLED',
      },
    });

    return { success: true };
  }

  async verifyBiometric(userId: string, biometricData: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.biometricKey) {
      return false;
    }

    const encryptedInput = this.encryptBiometricData(biometricData);
    return encryptedInput === user.biometricKey;
  }

  private encryptBiometricData(data: string): string {
    const encryptionKey = this.configService.get<string>('KYC_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('KYC_ENCRYPTION_KEY not configured');
    }

    const iv = randomBytes(12);
    const key = Buffer.from(encryptionKey, 'hex');
    const cipher = createHash('sha256').update(data).digest('hex');

    return `${iv.toString('hex')}:${cipher}`;
  }
}
