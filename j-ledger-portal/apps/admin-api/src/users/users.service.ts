import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
}
