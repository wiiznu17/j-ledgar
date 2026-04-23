import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceTrustLevel } from '@prisma/client';

const MAX_PIN_ATTEMPTS = 3;
const PIN_LOCK_DURATION_MS = 5 * 60 * 1000;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim() },
    });
  }

  async findByPhoneNumber(phoneNumber: string) {
    return this.prisma.user.findUnique({
      where: { phoneNumber: phoneNumber.trim() },
    });
  }

  async findByIdentity(identity: string) {
    const normalized = identity.trim();

    if (normalized.includes('@')) {
      return this.findByEmail(normalized);
    }

    return this.findByPhoneNumber(normalized);
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async getTrustedDeviceIdByIdentifier(userId: string, deviceIdentifier: string) {
    const device = await this.prisma.userDevice.findUnique({
      where: {
        userId_deviceIdentifier: {
          userId,
          deviceIdentifier,
        },
      },
    });

    if (!device || device.trustLevel !== DeviceTrustLevel.TRUSTED) {
      return null;
    }

    return device.id;
  }

  async handlePinFailure(userId: string) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        pinAttempts: { increment: 1 },
      },
    });

    if (updated.pinAttempts >= MAX_PIN_ATTEMPTS) {
      return this.prisma.user.update({
        where: { id: userId },
        data: {
          pinLockedUntil: new Date(Date.now() + PIN_LOCK_DURATION_MS),
        },
      });
    }

    return updated;
  }

  async resetPinAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pinAttempts: 0, pinLockedUntil: null },
    });
  }
}
