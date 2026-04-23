import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.user.findUnique({
      where: { userId },
      include: {
        kycDocuments: true,
        pii: true,
      },
    });
  }

  async create(data: { userId: string; email?: string; phone?: string }) {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async getUserKYC(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        kycDocuments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.userId,
      kycDocuments: user.kycDocuments,
    };
  }

  async getUserPII(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        pii: true,
      },
    });

    if (!user || !user.pii) {
      return null;
    }

    return {
      userId: user.userId,
      pii: user.pii,
    };
  }
}
