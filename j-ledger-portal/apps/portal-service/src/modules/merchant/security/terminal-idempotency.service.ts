import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TerminalIdempotencyService {
  private static readonly PROCESSING_STATUS = 102;

  constructor(private readonly prisma: PrismaService) {}

  generateHash(payload: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  async getRecord(
    terminalId: string,
    operation: string,
    idempotencyKey: string,
  ) {
    return this.prisma.terminalIdempotencyRecord.findUnique({
      where: {
        terminalId_operation_idempotencyKey: {
          terminalId,
          operation,
          idempotencyKey,
        },
      },
    });
  }

  async saveRecord(
    terminalId: string,
    operation: string,
    idempotencyKey: string,
    requestHash: string,
    responsePayload: any,
    status: number,
    ttlSeconds: number = 86400, // 24 hours default
  ) {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + ttlSeconds);

    return this.prisma.terminalIdempotencyRecord.create({
      data: {
        terminalId,
        operation,
        idempotencyKey,
        requestHash,
        responsePayload,
        status,
        expiresAt,
      },
    });
  }

  private async reserveKey(
    terminalId: string,
    operation: string,
    idempotencyKey: string,
    requestHash: string,
    ttlSeconds: number = 86400,
  ) {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + ttlSeconds);

    return this.prisma.terminalIdempotencyRecord.create({
      data: {
        terminalId,
        operation,
        idempotencyKey,
        requestHash,
        responsePayload: { status: 'PROCESSING' },
        status: TerminalIdempotencyService.PROCESSING_STATUS,
        expiresAt,
      },
    });
  }

  async handleIdempotency(
    terminalId: string,
    operation: string,
    idempotencyKey: string,
    payload: any,
    processFn: () => Promise<{ status: number; data: any }>,
  ) {
    const currentHash = this.generateHash(payload);
    let isOwner = false;

    try {
      await this.reserveKey(terminalId, operation, idempotencyKey, currentHash);
      isOwner = true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Record already exists
      } else {
        throw error;
      }
    }

    if (!isOwner) {
      const existing = await this.getRecord(
        terminalId,
        operation,
        idempotencyKey,
      );
      if (!existing) {
        throw new HttpException(
          'Idempotency lookup failed',
          HttpStatus.CONFLICT,
        );
      }
      if (existing.requestHash !== currentHash) {
        throw new HttpException(
          'Idempotency key conflict: same key used with different payload',
          HttpStatus.CONFLICT,
        );
      }
      if (existing.status === TerminalIdempotencyService.PROCESSING_STATUS) {
        throw new HttpException(
          'Request with this idempotency key is in progress, retry shortly',
          HttpStatus.CONFLICT,
        );
      }
      return {
        status: existing.status,
        data: existing.responsePayload,
        fromCache: true,
      };
    }

    try {
      const result = await processFn();
      await this.prisma.terminalIdempotencyRecord.update({
        where: {
          terminalId_operation_idempotencyKey: {
            terminalId,
            operation,
            idempotencyKey,
          },
        },
        data: {
          responsePayload: result.data,
          status: result.status,
        },
      });
      return { ...result, fromCache: false };
    } catch (error) {
      // Allow retry with same key when owner request fails before completion.
      await this.prisma.terminalIdempotencyRecord.deleteMany({
        where: { terminalId, operation, idempotencyKey },
      });
      throw error;
    }
  }
}
