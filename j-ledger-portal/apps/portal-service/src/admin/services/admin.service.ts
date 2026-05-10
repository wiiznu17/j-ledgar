import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MailService } from './mail.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

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
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        staffRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!staff) return null;

    // Flatten role for frontend DTO consistency
    const roleName = staff.staffRoles?.[0]?.role?.name || 'N/A';

    return {
      id: staff.id,
      username: staff.username,
      email: staff.email,
      firstName: staff.firstName,
      lastName: staff.lastName,
      isActive: staff.isActive,
      isInvited: !!staff.resetToken,
      inviteExpiry: staff.resetTokenExpiry,
      role: roleName,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    };
  }

  /**
   * Internal use only: Returns raw prisma staff object with relations.
   * Useful for authentication logic that needs refreshTokenHash, etc.
   */
  async findByIdInternal(id: string) {
    return this.prisma.staff.findUnique({
      where: { id },
      include: {
        staffRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async getStaffPermissions(staffId: string): Promise<string[]> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
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

    if (!staff) return [];

    const permissions = new Set<string>();
    staff.staffRoles.forEach((sr) => {
      sr.role.rolePermissions.forEach((rp) => {
        permissions.add(rp.permission.name);
      });
    });

    return Array.from(permissions);
  }

  async createStaff(data: {
    username: string;
    password?: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Generate dummy password if none provided, since it's required in DB
    const plainPassword =
      data.password || crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const staff = await this.prisma.staff.create({
      data: {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: hashedPassword,
        resetToken: token,
        resetTokenExpiry: tokenExpiry,
        staffRoles: data.role
          ? {
              create: {
                role: {
                  connect: { name: data.role },
                },
              },
            }
          : undefined,
      },
      include: {
        staffRoles: {
          include: { role: true },
        },
      },
    });

    await this.mailService.sendAdminInvite(staff.email, token);

    return staff;
  }

  async requestPasswordReset(staffId: string, isInvite: boolean = false) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
    });
    if (!staff) throw new Error('Staff not found');

    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.staff.update({
      where: { id: staffId },
      data: {
        resetToken: token,
        resetTokenExpiry: tokenExpiry,
      },
    });

    if (isInvite) {
      await this.mailService.sendAdminInvite(staff.email, token);
    } else {
      await this.mailService.sendPasswordReset(staff.email, token);
    }

    return {
      message: isInvite
        ? 'Invitation link resent'
        : 'Password reset link sent to email',
    };
  }

  private validatePasswordComplexity(password: string) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (
      password.length < minLength ||
      !hasUpperCase ||
      !hasLowerCase ||
      !hasSpecialChar
    ) {
      throw new Error(
        'Password must be at least 8 characters long and contain uppercase, lowercase, and at least one special character.',
      );
    }
  }

  async validateResetToken(token: string) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        resetToken: token,
        isActive: true,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });
    return !!staff;
  }

  async resetPasswordWithToken(token: string, newPassword: string) {
    const staff = await this.prisma.staff.findFirst({
      where: {
        resetToken: token,
        isActive: true,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!staff) {
      throw new Error('Invalid or expired reset token');
    }

    this.validatePasswordComplexity(newPassword);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.staff.update({
      where: { id: staff.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        isActive: true, // Automatically activate if this was a new invitation
      },
    });

    return { success: true };
  }

  async updateStaff(id: string, data: any) {
    const { role, ...updateData } = data;

    if (updateData.password) {
      this.validatePasswordComplexity(updateData.password);
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update basic staff info
      const staff = await tx.staff.update({
        where: { id },
        data: updateData,
      });

      // 2. Update role if provided
      if (role) {
        // Delete existing roles
        await tx.staffRole.deleteMany({
          where: { staffId: id },
        });

        // Create new role assignment
        await tx.staffRole.create({
          data: {
            staff: {
              connect: { id: id },
            },
            role: {
              connect: { name: role },
            },
          },
        });
      }

      return staff;
    });
  }

  async findAllStaff(
    page: number = 1,
    limit: number = 10,
    filters?: { search?: string; role?: string; status?: string },
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters?.search && filters.search.trim() !== '') {
      where.OR = [
        { username: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.status && filters.status !== 'ALL') {
      where.isActive = filters.status === 'ACTIVE';
    }

    if (filters?.role && filters.role !== 'ALL') {
      where.staffRoles = {
        some: {
          role: {
            name: filters.role,
          },
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          resetToken: true,
          resetTokenExpiry: true,
          createdAt: true,
          updatedAt: true,
          staffRoles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.staff.count({ where }),
    ]);

    // Explicitly map to AdminUser DTO and flatten role
    const flattenedItems = items.map((staff: any) => {
      const roleName = staff.staffRoles?.[0]?.role?.name || 'N/A';
      console.log('roleName', roleName);
      return {
        id: staff.id,
        username: staff.username,
        email: staff.email,
        firstName: staff.firstName,
        lastName: staff.lastName,
        isActive: staff.isActive,
        isInvited: !!staff.resetToken,
        inviteExpiry: staff.resetTokenExpiry,
        role: roleName,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
      };
    });

    return {
      data: flattenedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async removeStaff(id: string) {
    const staff = await this.prisma.staff.findUnique({ where: { id } });
    if (staff?.email === 'admin@jledger.com') {
      throw new Error('Cannot delete primary system administrator');
    }

    return this.prisma.staff.delete({
      where: { id },
    });
  }

  async deactivateStaff(id: string) {
    return this.prisma.staff.update({
      where: { id },
      data: {
        isActive: false,
        refreshTokenHash: null,
      } as any,
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
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (role?.isSystem) {
      throw new Error('Cannot modify system roles');
    }
    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async assignPermission(roleId: string, permissionId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (role?.isSystem) {
      throw new Error('Cannot modify permissions for system roles');
    }
    return this.prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  }

  async removePermission(roleId: string, permissionId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (role?.isSystem) {
      throw new Error('Cannot modify permissions for system roles');
    }
    return this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    });
  }

  async syncRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (role?.isSystem) {
      throw new Error('Cannot modify permissions for system roles');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Remove all current permissions
      await tx.rolePermission.deleteMany({ where: { roleId } });

      // 2. Add new permissions
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((pId) => ({
            roleId,
            permissionId: pId,
          })),
        });
      }

      return { success: true };
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
