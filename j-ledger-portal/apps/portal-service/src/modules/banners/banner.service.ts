import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class BannerService {
  private readonly logger = new Logger(BannerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getActiveBanners() {
    return this.prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: new Date() } }] }],
      },
      orderBy: { priority: 'desc' },
    });
  }

  async getAllBanners() {
    return this.prisma.banner.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBanner(data: any) {
    return this.prisma.banner.create({
      data,
    });
  }

  async updateBanner(id: string, data: any) {
    return this.prisma.banner.update({
      where: { id },
      data,
    });
  }

  async deleteBanner(id: string) {
    return this.prisma.banner.delete({
      where: { id },
    });
  }
}
