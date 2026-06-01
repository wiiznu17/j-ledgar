import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { TerminalIdempotencyService } from '../../security/terminal-idempotency.service';
import { AuditAction, ResourceType } from '../../../audit/audit.service';

@Injectable()
export class MerchantTerminalRedemptionService {
  private readonly logger = new Logger(MerchantTerminalRedemptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotencyService: TerminalIdempotencyService,
  ) {}

  async processTerminalRedemption(
    terminalId: string,
    body: { redemptionCode: string; idempotencyKey: string },
  ) {
    return this.idempotencyService.handleIdempotency(
      terminalId,
      'REDEEM',
      body.idempotencyKey,
      body,
      async () => {
        return this.prisma.$transaction(async (tx) => {
          const terminal = (await tx.terminal.findUnique({
            where: { id: terminalId },
            include: { merchant: { include: { partner: true } } },
          })) as any;

          if (!terminal)
            throw new HttpException('Terminal not found', HttpStatus.NOT_FOUND);

          if (!terminal.merchant?.partner?.isLoyaltyEnabled) {
            throw new HttpException(
              'Merchant loyalty rewards program is currently disabled',
              HttpStatus.FORBIDDEN,
            );
          }

          // 1. Fetch redemption code and check ownership
          const redemption = await tx.dealRedemption.findUnique({
            where: { redemptionCode: body.redemptionCode },
            include: { deal: { include: { brand: true } } },
          });

          if (!redemption) {
            throw new HttpException('Redemption code not found', HttpStatus.NOT_FOUND);
          }

          if (redemption.status === 'USED') {
            throw new HttpException('Code has already been used', HttpStatus.BAD_REQUEST);
          }

          if (redemption.status !== 'REDEEMED') {
            throw new HttpException('Invalid code status', HttpStatus.BAD_REQUEST);
          }

          // 2. Validate that the deal belongs to the partner associated with the terminal
          if (
            redemption.deal.brand.partnerId &&
            redemption.deal.brand.partnerId !== terminal.merchant.partnerId
          ) {
            throw new HttpException(
              'This deal is not eligible for redemption at this merchant',
              HttpStatus.BAD_REQUEST,
            );
          }

          const usedAt = new Date();
          await tx.dealRedemption.update({
            where: { id: redemption.id },
            data: {
              status: 'USED' as any,
              usedAt,
              usedAtMerchantId: terminal.merchantId,
            },
          });

          await tx.auditLog.create({
            data: {
              adminUserId: null,
              action: AuditAction.MERCHANT_REDEMPTION,
              resourceType: ResourceType.MERCHANT,
              resourceId: terminal.merchantId,
              ipAddress: '0.0.0.0',
              userAgent: 'Terminal/' + terminal.hardwareId,
              requestPayload: {
                terminalId,
                redemptionCode: body.redemptionCode,
                idempotencyKey: body.idempotencyKey,
              },
              responseStatus: 200,
            },
          });

          return {
            status: HttpStatus.OK,
            data: {
              success: true,
              redemptionCode: body.redemptionCode,
              usedAt,
            },
          };
        });
      },
    );
  }

  async verifyRedemption(code: string, terminalId: string) {
    const redemption = await this.prisma.dealRedemption.findUnique({
      where: { redemptionCode: code },
      include: {
        deal: {
          include: { brand: true },
        },
      },
    });

    if (!redemption) {
      throw new HttpException('Invalid redemption code', HttpStatus.NOT_FOUND);
    }

    if (redemption.status !== 'REDEEMED') {
      const statusMsg =
        redemption.status === 'USED'
          ? 'Code already used'
          : 'Code expired or cancelled';
      throw new HttpException(statusMsg, HttpStatus.BAD_REQUEST);
    }

    if (redemption.expiresAt && new Date() > redemption.expiresAt) {
      // Auto-expire if needed
      await this.prisma.dealRedemption.update({
        where: { id: redemption.id },
        data: { status: 'EXPIRED' },
      });
      throw new HttpException('Code expired', HttpStatus.BAD_REQUEST);
    }

    return {
      isValid: true,
      dealTitle: redemption.deal.title,
      brandName: redemption.deal.brand.name,
      pointsSpent: redemption.pointsSpent,
      expiresAt: redemption.expiresAt,
    };
  }

  async useRedemption(code: string, terminalId: string) {
    const terminal = await this.prisma.terminal.findUnique({
      where: { id: terminalId },
      include: {
        merchant: {
          include: { partner: true },
        },
      },
    });

    if (!terminal)
      throw new HttpException('Terminal not found', HttpStatus.UNAUTHORIZED);

    const redemption = await this.prisma.dealRedemption.findUnique({
      where: { redemptionCode: code },
    });

    if (!redemption)
      throw new HttpException('Invalid code', HttpStatus.NOT_FOUND);
    if (redemption.status !== 'REDEEMED') {
      throw new HttpException(
        `Code already ${redemption.status.toLowerCase()}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Update status to USED
    const updated = await this.prisma.dealRedemption.update({
      where: { id: redemption.id },
      data: {
        status: 'USED',
        usedAt: new Date(),
        usedAtMerchantId: terminal.merchantId,
      },
    });

    this.logger.log(
      `Redemption code ${code} used at terminal ${terminalId} (Merchant: ${terminal.merchantId})`,
    );

    return {
      success: true,
      usedAt: updated.usedAt,
      redemptionId: updated.id,
    };
  }
}
