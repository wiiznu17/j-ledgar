import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ISmsProvider } from '../integrations/interfaces/sms-provider.interface';

const OTP_TTL_SECONDS = 3 * 60;

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ISmsProvider) private readonly smsProvider: ISmsProvider,
  ) {}

  async generateOtp(
    userId: string | null,
    phoneNumber: string,
  ): Promise<{ challengeId: string; code: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    const challenge = await this.prisma.otpChallenge.create({
      data: {
        userId,
        phoneNumber,
        code: await bcrypt.hash(code, 10),
        expiresAt,
      },
    });

    return {
      challengeId: challenge.id,
      code,
    };
  }

  async sendOtp(phoneNumber: string, message: string): Promise<void> {
    await this.smsProvider.sendMessage(phoneNumber, message);
  }

  async verifyOtp(challengeId: string, phoneNumber: string, otp: string): Promise<boolean> {
    const challenge = await this.prisma.otpChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new BadRequestException('Invalid challenge');
    }

    if (challenge.phoneNumber !== phoneNumber) {
      throw new BadRequestException('Phone number mismatch');
    }

    if (challenge.expiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    if (challenge.verifiedAt) {
      throw new BadRequestException('OTP already verified');
    }

    const isOtpValid = await bcrypt.compare(otp, challenge.code);
    if (!isOtpValid) {
      await this.prisma.otpChallenge.update({
        where: { id: challengeId },
        data: { attempts: { increment: 1 } },
      });
      return false;
    }

    await this.prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { verifiedAt: new Date() },
    });

    return true;
  }

  async markAsVerified(challengeId: string): Promise<void> {
    await this.prisma.otpChallenge.update({
      where: { id: challengeId },
      data: { verifiedAt: new Date() },
    });
  }

  async cleanupExpiredChallenges(): Promise<void> {
    await this.prisma.otpChallenge.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }
}
