import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  public readonly read: PrismaClient;

  constructor() {
    super();
    this.read = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_READ_URL || process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await Promise.all([
      this.$connect(),
      this.read.$connect(),
    ]);
  }

  async onModuleDestroy() {
    await Promise.all([
      this.$disconnect(),
      this.read.$disconnect(),
    ]);
  }
}
