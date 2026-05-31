import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  AuditService,
  AuditAction,
  ResourceType,
} from '../../audit/audit.service';
import { randomBytes, timingSafeEqual, createHmac } from 'crypto';

@Injectable()
export class MerchantPosService {
  private readonly logger = new Logger(MerchantPosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async validateTerminalSignature(
    terminalId: string,
    signature: string,
    timestamp: string,
    nonce: string,
    method: string,
    path: string,
  ): Promise<boolean> {
    const terminal = await this.prisma.terminal.findUnique({
      where: { id: terminalId },
    });

    if (!terminal || terminal.status !== 'ACTIVE') return false;

    const message = `${method.toUpperCase()}:${path}:${timestamp}:${nonce}`;
    const computedSignature = createHmac('sha256', terminal.secretKey)
      .update(message)
      .digest('hex');

    if (computedSignature.length !== signature.length) {
      return false;
    }
    return timingSafeEqual(
      Buffer.from(computedSignature, 'utf8'),
      Buffer.from(signature, 'utf8'),
    );
  }

  async createTerminal(
    merchantId: string,
    body: { name: string; hardwareId?: string },
  ) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { partner: true },
    });

    if (!merchant)
      throw new HttpException('Merchant not found', HttpStatus.NOT_FOUND);

    // ENFORCE: SME (partner.type === 'SME') can only have 1 terminal
    if (merchant.partner.type === 'SME') {
      const count = await this.prisma.terminal.count({
        where: { merchantId },
      });
      if (count >= 1) {
        throw new HttpException(
          'SME merchants are restricted to a single terminal node.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const secretKey = 'sk_' + randomBytes(24).toString('hex');
    const hardwareId =
      body.hardwareId || 'HW-' + randomBytes(4).toString('hex').toUpperCase();

    const terminal = await this.prisma.terminal.create({
      data: {
        merchantId,
        name: body.name,
        hardwareId,
        secretKey,
        status: 'ACTIVE',
      },
    });

    await this.auditService.log({
      adminUserId: null,
      action: AuditAction.CREATE,
      resourceType: ResourceType.TERMINAL,
      resourceId: terminal.id,
      ipAddress: '0.0.0.0',
      userAgent: 'System/Admin',
      requestPayload: { merchantId, name: body.name, hardwareId }, // DON'T log secretKey
      responseStatus: 201,
    });

    return terminal; // On creation, we return it ONCE so admin can give it to merchant
  }

  private maskMerchantSecrets(data: any): any {
    if (!data) return data;
    if (Array.isArray(data))
      return data.map((i) => this.maskMerchantSecrets(i));
    if (typeof data !== 'object') return data;

    const masked = { ...data };
    if (masked.secretKey) delete masked.secretKey;

    // Recursively mask nested objects
    for (const key in masked) {
      if (typeof masked[key] === 'object') {
        masked[key] = this.maskMerchantSecrets(masked[key]);
      }
    }
    return masked;
  }

  async getMerchantTerminals(merchantUserId: string) {
    const partner = await this.prisma.partner.findFirst({
      where: { userId: merchantUserId },
      include: {
        merchants: {
          include: { terminals: true },
        },
      },
    });

    if (!partner)
      throw new HttpException('Partner not found', HttpStatus.NOT_FOUND);

    return partner.merchants.flatMap((m) =>
      m.terminals.map((t) => ({
        id: t.id,
        name: t.name,
        hardwareId: t.hardwareId,
        status: t.status,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        branchName: m.name,
      })),
    );
  }

  async findTerminalsByMerchantId(merchantId: string) {
    const terminals = await this.prisma.terminal.findMany({
      where: { merchantId },
    });
    return this.maskMerchantSecrets(terminals);
  }

  async rotateTerminalSecret(terminalId: string) {
    const terminal = await this.prisma.terminal.findUnique({
      where: { id: terminalId },
    });

    if (!terminal)
      throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND);

    const newSecret = randomBytes(32).toString('hex');

    const updated = await this.prisma.terminal.update({
      where: { id: terminalId },
      data: {
        secretKey: newSecret,
      },
    });

    this.logger.log(`Terminal secret rotated for node: ${terminalId}`);

    return {
      id: updated.id,
      name: updated.name,
      secretKey: newSecret,
    };
  }
}
