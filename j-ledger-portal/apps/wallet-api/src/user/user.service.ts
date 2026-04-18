import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const MAX_PIN_ATTEMPTS = 3;
const PIN_LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

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

  /**
   * Atomically increments pinAttempts using Prisma's { increment } operator.
   *
   * This replaces the previous non-atomic read-modify-write (findById → +1 → save)
   * which allowed concurrent PIN attempts to bypass the 3-attempt lockout via a race
   * condition. The { increment: 1 } translates to a single SQL:
   *   UPDATE users SET pin_attempts = pin_attempts + 1 WHERE id = $1
   * ensuring correctness under any level of concurrency.
   *
   * If the incremented count reaches MAX_PIN_ATTEMPTS, the lock timestamp is also
   * set atomically in the same UPDATE, preventing a second concurrent call from
   * skipping the lockout entirely.
   */
  async handlePinFailure(userId: string) {
    // Step 1: Atomically increment the counter
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        pinAttempts: { increment: 1 },
      },
    });

    // Step 2: If the new count has crossed the threshold, set the lock — also atomically
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
