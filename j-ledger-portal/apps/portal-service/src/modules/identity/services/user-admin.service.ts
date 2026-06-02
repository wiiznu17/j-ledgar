import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { UserSecurityService } from './user-security.service';
import { UserStatus, NotificationEventType } from '@repo/dto';
import { PaginationUtility } from '../../../common/utils/pagination.util';

@Injectable()
export class UserAdminService {
  private readonly logger = new Logger(UserAdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userSecurityService: UserSecurityService,
  ) {}

  async findAllUsers(
    page: number = 1,
    limit: number = 10,
    filters?: { email?: string; phone?: string; status?: string },
  ) {
    const where: any = {};

    if (filters?.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }
    if (filters?.phone) {
      where.phoneNumber = { contains: filters.phone, mode: 'insensitive' };
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return PaginationUtility.paginate(
      (opt) =>
        this.prisma.user.findMany({
          where,
          ...opt,
          select: {
            id: true,
            phoneNumber: true,
            email: true,
            status: true,
            registrationState: true,
            ledgerAccountId: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      () => this.prisma.user.count({ where }),
      { page, limit },
    );
  }

  async getUserStats() {
    const [total, active, pending, blocked] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({
        where: { status: UserStatus.PENDING_APPROVAL },
      }),
      this.prisma.user.count({ where: { status: UserStatus.BLOCKED } }),
    ]);

    return {
      total,
      active,
      pending,
      blocked,
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
      data: { status: status as UserStatus },
    });
  }

  async suspendUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('User not found');

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Only ACTIVE users can be suspended');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.SUSPENDED },
    });

    await this.userSecurityService.logSecurityEvent(id, NotificationEventType.ACCOUNT_LOCKED, {
      action: 'SUSPENDED',
      reason: 'Suspended by administrative staff',
    });

    return updated;
  }

  async activateUser(id: string) {
    // use for unsuspending and unblocking
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('User not found');

    // Business Logic: Only allow activation (unsuspend/unblock) of SUSPENDED or BLOCKED users
    if (
      user.status !== UserStatus.SUSPENDED &&
      user.status !== UserStatus.BLOCKED
    ) {
      throw new ForbiddenException(
        'Only SUSPENDED or BLOCKED users can be activated',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
    });

    await this.userSecurityService.logSecurityEvent(id, NotificationEventType.ACCOUNT_UNLOCKED, {
      action: 'ACTIVATED',
      reason: 'Reactivated by administrative staff',
    });

    return updated;
  }

  async blockUser(id: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new BadRequestException('User not found');

    if (
      user.status !== UserStatus.ACTIVE &&
      user.status !== UserStatus.SUSPENDED
    ) {
      throw new ForbiddenException(
        'User must be approved (ACTIVE/SUSPENDED) before being blocked',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.BLOCKED },
    });

    await this.userSecurityService.logSecurityEvent(id, NotificationEventType.ACCOUNT_LOCKED, {
      action: 'BLOCKED',
      reason: reason || 'Blocked by administrative staff',
    });

    return updated;
  }

  async getUserActivity(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userDevices: {
          select: {
            deviceIdentifier: true,
            deviceName: true,
            deviceType: true,
            osVersion: true,
            trustLevel: true,
            lastSeenAt: true,
            createdAt: true,
          },
          orderBy: { lastSeenAt: 'desc' },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      devices: user.userDevices,
      createdAt: user.createdAt,
      lastLoginAt: user.userDevices[0]?.lastSeenAt || null,
    };
  }

  async getSuspiciousActivities(userId: string) {
    // TODO: Implement get suspicious activities logic
    return [];
  }

  async reportSuspiciousActivityToAmlo(activityId: string, userId: string) {
    // TODO: Implement AMLO reporting logic
    return { success: true };
  }
}
