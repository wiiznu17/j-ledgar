import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.staff.findUnique({
      where: { username },
      include: {
        staffRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.staff.findUnique({
      where: { email },
      include: {
        staffRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateRefreshTokenHash(staffId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    return this.prisma.staff.update({
      where: { id: staffId },
      data: { refreshTokenHash: hash } as any,
    });
  }

  async clearRefreshToken(staffId: string) {
    return this.prisma.staff.update({
      where: { id: staffId },
      data: { refreshTokenHash: null } as any,
    });
  }

  async findById(id: string) {
    return this.prisma.staff.findUnique({
      where: { id },
    });
  }

  async create(data: {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.staff.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async update(id: string, data: any) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.prisma.staff.update({
      where: { id },
      data,
    });
  }

  async findAll() {
    return this.prisma.staff.findMany({
      include: {
        staffRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.staff.delete({
      where: { id },
    });
  }

  async deactivate(id: string) {
    return this.prisma.staff.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reactivate(id: string) {
    return this.prisma.staff.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async assignRole(staffId: string, roleId: string) {
    return this.prisma.staffRole.create({
      data: {
        staffId,
        roleId,
      },
    });
  }

  async removeRole(staffId: string, roleId: string) {
    return this.prisma.staffRole.deleteMany({
      where: {
        staffId,
        roleId,
      },
    });
  }

  async searchStaff(query: string) {
    return this.prisma.staff.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        staffRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }
}
