import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSetting(userId: string, key: string) {
    const setting = await this.prisma.userSetting.findUnique({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });

    if (!setting) {
      return null;
    }

    return setting.value;
  }

  async getAllSettings(userId: string) {
    const settings = await this.prisma.userSetting.findMany({
      where: { userId },
    });

    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    return settingsMap;
  }

  async setSetting(userId: string, key: string, value: string) {
    return this.prisma.userSetting.upsert({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
      update: { value },
      create: { userId, key, value },
    });
  }

  async deleteSetting(userId: string, key: string) {
    const setting = await this.prisma.userSetting.findUnique({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });

    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    await this.prisma.userSetting.delete({
      where: { id: setting.id },
    });

    return { success: true };
  }

  async resetSettings(userId: string) {
    await this.prisma.userSetting.deleteMany({
      where: { userId },
    });

    return { success: true };
  }
}
