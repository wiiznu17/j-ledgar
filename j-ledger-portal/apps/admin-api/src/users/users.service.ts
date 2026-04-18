import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LedgerProxyService } from '../ledger-proxy/ledger-proxy.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private proxyService: LedgerProxyService,
  ) {}

  async findAll() {
    return this.prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async create(data: { email: string; password: string; role: string }) {
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

  async freezeWalletUser(userId: string) {
    // 1. Mark as inactive in Prisma
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // 2. Fetch associated accountId from Java Core
    const accounts = await this.proxyService.forwardToGateway(
      'get',
      `/api/v1/accounts/user/${userId}`,
    );

    if (accounts && accounts.length > 0) {
      // 3. Freeze the account in Java Core (using the first account found)
      const accountId = accounts[0].id;
      await this.proxyService.forwardToGateway(
        'put',
        `/api/v1/accounts/${accountId}/status`,
        { status: 'FROZEN' },
      );
    }

    return user;
  }
}
