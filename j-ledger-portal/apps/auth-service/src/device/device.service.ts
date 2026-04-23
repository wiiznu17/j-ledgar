import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeviceTrustLevel } from '@prisma/client';

@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  async createDevice(
    userId: string,
    deviceIdentifier: string,
    deviceName?: string,
    trustLevel: DeviceTrustLevel = DeviceTrustLevel.UNKNOWN,
  ) {
    return this.prisma.userDevice.create({
      data: {
        userId,
        deviceIdentifier,
        deviceName,
        trustLevel,
        lastSeenAt: new Date(),
      },
    });
  }

  async getDeviceByIdentifier(userId: string, deviceIdentifier: string) {
    return this.prisma.userDevice.findUnique({
      where: {
        userId_deviceIdentifier: {
          userId,
          deviceIdentifier,
        },
      },
    });
  }

  async updateDeviceLastSeen(deviceId: string) {
    return this.prisma.userDevice.update({
      where: { id: deviceId },
      data: { lastSeenAt: new Date() },
    });
  }

  async updateDeviceTrustLevel(deviceId: string, trustLevel: DeviceTrustLevel) {
    return this.prisma.userDevice.update({
      where: { id: deviceId },
      data: { trustLevel },
    });
  }

  async getUserDevices(userId: string) {
    return this.prisma.userDevice.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async removeDevice(deviceId: string) {
    return this.prisma.userDevice.delete({
      where: { id: deviceId },
    });
  }

  async revokeAllTrustedDevicesExcept(userId: string, exceptDeviceId: string) {
    return this.prisma.userDevice.updateMany({
      where: {
        userId,
        id: { not: exceptDeviceId },
        trustLevel: DeviceTrustLevel.TRUSTED,
      },
      data: { trustLevel: DeviceTrustLevel.UNTRUSTED },
    });
  }
}
