import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

    if (!device || device.trustLevel !== 'TRUSTED') {
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

  async findAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          phoneNumber: true,
          email: true,
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchUsers(query: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { phoneNumber: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        createdAt: true,
        status: true,
      },
      take: 20,
    });
  }

  async updateUserStatus(id: string, status: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async getUserActivity(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        devices: {
          select: {
            deviceIdentifier: true,
            trustLevel: true,
            lastUsedAt: true,
            createdAt: true,
          },
          orderBy: { lastUsedAt: 'desc' },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      devices: user.devices,
      createdAt: user.createdAt,
      lastLoginAt: user.devices[0]?.lastUsedAt || null,
    };
  }
}
