import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { REDIS_CLIENT } from '../../../core/common/constants';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

@Injectable()
export class StatementExportService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async requestStatementExport(userId: string, body: { year: number; month: number }) {
    if (!userId) {
      throw new HttpException(
        { message: 'Unauthorized' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException(
        { message: 'User not found' },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!user.email) {
      throw new HttpException(
        { message: 'กรุณากรอกและยืนยันที่อยู่อีเมลในโปรไฟล์ก่อนร้องขอประวัติการเดินบัญชี' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const verificationSetting = await this.prisma.userSetting.findUnique({
      where: {
        userId_key: {
          userId,
          key: 'email_verified',
        },
      },
    });

    if (!verificationSetting || verificationSetting.value !== 'true') {
      throw new HttpException(
        { message: 'กรุณายันยืนที่อยู่อีเมลในโปรไฟล์ก่อนร้องขอประวัติการเดินบัญชี' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const id = `APR-${randomUUID()}`;
    const record = {
      id,
      category: 'SECURITY',
      action: 'EXPORT_STATEMENT',
      initiatorId: userId,
      initiatorEmail: user.email,
      target: 'EXPORT_STATEMENT',
      payload: {
        userId,
        year: body.year,
        month: body.month,
        email: user.email,
      },
      status: 'PENDING',
      reason: `Request Statement Export for ${body.month}/${body.year}`,
      notes: null,
      createdAt: new Date().toISOString(),
    };

    const key = `admin:approvals:item:${id}`;
    await this.redis.set(key, JSON.stringify(record));

    return {
      success: true,
      message: 'ส่งคำขอส่งออกรายการเดินบัญชีเรียบร้อยแล้ว กรุณารอผู้ดูแลระบบอนุมัติ',
      approvalId: id,
    };
  }
}
