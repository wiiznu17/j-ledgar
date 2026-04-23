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
}
