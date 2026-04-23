import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany();
  }

  async findById(id: string) {
    return this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async create(data: { name: string; description?: string; resource: string; action: string }) {
    return this.prisma.permission.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.permission.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.permission.delete({
      where: { id },
    });
  }
}
