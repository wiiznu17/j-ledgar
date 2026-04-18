import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';
import { WalletUser, AdminUser, CreateAdminRequest, Account, AccountStatus } from '@repo/dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private proxyService: LedgerProxyService,
  ) {}

  async findAll(): Promise<Partial<AdminUser>[]> {
    const users = await this.prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    return users.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  async findWalletUsers(): Promise<WalletUser[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return users.map(u => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  async create(data: CreateAdminRequest) {
    const existing = await this.prisma.adminUser.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.adminUser.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  }

  async remove(id: string) {
    try {
      return await this.prisma.adminUser.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * Freezes a wallet user by synchronizing state across both systems.
   *
   * RACE-5 Fix: The order of operations is critical for split-brain safety.
   * The Java Core ledger is the source of truth for money movement.
   * We freeze it FIRST so that no transfers can proceed even if the second
   * step (Prisma update) fails. If the Prisma update fails, we attempt to
   * compensate by re-activating the ledger account, and surface the error
   * to the caller rather than silently entering a split-brain state.
   *
   * Sequence:
   *   1. Fetch accountId from Java Core (GET /accounts/user/{userId})
   *   2. Freeze ledger account (PUT /accounts/{accountId}/status → FROZEN)  ← source of truth
   *   3. Mark user inactive in Prisma (isActive = false)
   *   4. On Prisma failure → compensate by re-activating ledger account
   */
  async freezeWalletUser(userId: string) {
    // Step 1: Resolve accountId from Java Core
    const accounts = await this.proxyService.forwardToGateway<Account[]>(
      'get',
      `/api/v1/accounts/user/${userId}`,
    );

    const accountId: string | undefined = accounts?.[0]?.id;

    // Step 2: Freeze the ledger account FIRST (source of truth for money)
    if (accountId) {
      await this.proxyService.forwardToGateway(
        'put',
        `/api/v1/accounts/${accountId}/status`,
        { status: AccountStatus.FROZEN },
      );
    }

    // Step 3: Mark the portal user as inactive in Prisma
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });
    } catch (prismaError) {
      // Step 4: Compensating action — re-activate ledger account to avoid split-brain
      if (accountId) {
        try {
          await this.proxyService.forwardToGateway(
            'put',
            `/api/v1/accounts/${accountId}/status`,
            { status: AccountStatus.ACTIVE },
          );
        } catch (compensationError) {
          // Compensation itself failed — log CRITICAL for manual intervention
          console.error(
            `CRITICAL: Split-brain detected! Ledger account ${accountId} is FROZEN ` +
            `but Prisma user ${userId} is still active. Manual intervention required.`,
            compensationError,
          );
        }
      }
      throw new InternalServerErrorException(
        'Failed to freeze user in portal database. Ledger account has been re-activated to maintain consistency.',
      );
    }
  }
}
