import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { DeviceTrustLevel, RegistrationState, UserStatus } from '@prisma/client-wallet';

const MAX_PIN_ATTEMPTS = 3;
const PIN_LOCK_DURATION_MS = 5 * 60 * 1000;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerProxyService: LedgerProxyService,
  ) {}

  async create(phoneNumber: string, password: string, pin: string) {
    const normalizedPhone = phoneNumber.trim();
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ phoneNumber: normalizedPhone }, { email: normalizedPhone }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const pinHash = await bcrypt.hash(pin, 10);

    return this.prisma.user.create({
      data: {
        phoneNumber: normalizedPhone,
        passwordHash,
        pinHash,
        status: UserStatus.ACTIVE,
        registrationState: RegistrationState.COMPLETED,
      },
    });
  }

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

  async updatePin(userId: string, pin: string) {
    const pinHash = await bcrypt.hash(pin, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { pinHash },
    });
  }

  async resolveLedgerAccountId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.ledgerAccountId) {
      return user.ledgerAccountId;
    }

    const accountResponse = await this.ledgerProxyService.getAccountByUserId(userId);
    const accountId = accountResponse?.data?.id as string | undefined;
    if (!accountId) {
      throw new ForbiddenException('ACCOUNT_NOT_READY');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { ledgerAccountId: accountId },
    });

    return accountId;
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
