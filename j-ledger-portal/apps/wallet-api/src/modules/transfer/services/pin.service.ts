import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

/**
 * PIN Validation Service
 * Implements Thailand-specific security requirements:
 * - PIN verification for sensitive operations
 * - Attempt tracking (PDPA compliance)
 * - Progressive lockout: 3 failures → 30 min lockout
 * - 24-hour reset window
 */
@Injectable()
export class PinService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate user PIN for transaction
   * Implements lockout mechanism:
   * - 3 attempts → 30 min lockout
   * - Max 5 attempts per 24 hours
   * @throws BadRequestException if PIN invalid or attempts exceeded
   * @throws ForbiddenException if account locked
   */
  async validatePin(userId: string, pinInput: string): Promise<void> {
    // Step 1: Check if user is locked
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pinHash: true, pinLockedUntil: true, pinAttempts: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      const minutesRemaining = Math.ceil((user.pinLockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(
        `Account locked due to too many failed PIN attempts. Try again in ${minutesRemaining} minutes.`,
      );
    }

    // Step 2: Verify PIN hash
    let pinValid = false;
    try {
      pinValid = await bcrypt.compare(pinInput, user.pinHash || '');
    } catch (error) {
      throw new BadRequestException('Invalid PIN format');
    }

    // Step 3: Log attempt
    const attempt = await this.prisma.pinAttempt.create({
      data: {
        userId,
        attemptNumber: user.pinAttempts + 1,
        success: pinValid,
      },
    });

    if (!pinValid) {
      // Failed attempt
      const failedAttempts = user.pinAttempts + 1;

      if (failedAttempts >= 3) {
        // Lock account for 30 minutes
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            pinAttempts: failedAttempts,
            pinLockedUntil: lockUntil,
          },
        });

        throw new ForbiddenException(
          'Too many failed PIN attempts. Account locked for 30 minutes.',
        );
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { pinAttempts: failedAttempts },
      });

      throw new BadRequestException(`Invalid PIN. ${3 - failedAttempts} attempts remaining.`);
    }

    // Success: Reset attempt counter
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pinAttempts: 0,
        pinLockedUntil: null,
      },
    });
  }

  /**
   * Set new PIN for user
   * Hash using bcrypt with salt rounds = 10
   */
  async setPin(userId: string, plainPin: string): Promise<void> {
    const pinHash = await bcrypt.hash(plainPin, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { pinHash },
    });
  }

  /**
   * Check if user has PIN set
   */
  async hasPinSet(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { pinHash: true },
    });
    return !!user?.pinHash;
  }

  /**
   * Reset PIN attempts (admin only, after support verification)
   */
  async resetPinAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pinAttempts: 0,
        pinLockedUntil: null,
      },
    });
  }

  /**
   * Get PIN attempt history for audit trail
   */
  async getAttemptHistory(userId: string, hours: number = 24): Promise<any> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.prisma.pinAttempt.findMany({
      where: {
        userId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
