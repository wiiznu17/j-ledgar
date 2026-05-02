import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ==================== Staff Management ====================

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

  async createStaff(data: {
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

  async updateStaff(id: string, data: any) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.prisma.staff.update({
      where: { id },
      data,
    });
  }

  async findAllStaff() {
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

  async removeStaff(id: string) {
    return this.prisma.staff.delete({
      where: { id },
    });
  }

  async deactivateStaff(id: string) {
    return this.prisma.staff.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reactivateStaff(id: string) {
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

  // ==================== Role Management ====================

  async findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findRoleById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async createRole(data: { name: string; description?: string }) {
    return this.prisma.role.create({
      data,
    });
  }

  async updateRole(id: string, data: any) {
    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async assignPermission(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }

  async removePermission(roleId: string, permissionId: string) {
    return this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    });
  }

  // ==================== Permission Management ====================

  async findAllPermissions() {
    return this.prisma.permission.findMany();
  }

  async findPermissionById(id: string) {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async createPermission(data: {
    name: string;
    description?: string;
    resource: string;
    action: string;
  }) {
    return this.prisma.permission.create({
      data,
    });
  }

  async updatePermission(id: string, data: any) {
    return this.prisma.permission.update({
      where: { id },
      data,
    });
  }
}
