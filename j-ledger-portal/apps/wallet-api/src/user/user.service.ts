import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(email: string, password: string, pin: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const transactionPin = await bcrypt.hash(pin, 10);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        transactionPin,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updatePin(userId: string, pin: string) {
    const transactionPin = await bcrypt.hash(pin, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { transactionPin },
    });
  }

  async bindDevice(userId: string, deviceId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { deviceId },
    });
  }

  async handlePinFailure(userId: string) {
    const user = await this.findById(userId);
    const pinAttempts = user.pinAttempts + 1;
    let pinLockedUntil = user.pinLockedUntil;

    if (pinAttempts >= 3) {
      // Lock for 5 minutes
      pinLockedUntil = new Date(Date.now() + 5 * 60 * 1000);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { pinAttempts, pinLockedUntil },
    });
  }

  async resetPinAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pinAttempts: 0, pinLockedUntil: null },
    });
  }
}
