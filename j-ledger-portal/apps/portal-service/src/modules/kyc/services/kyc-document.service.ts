import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { FinanceService } from '../../../core/finance/finance.service';
import { KafkaProducerService } from '../../notification/kafka-producer.service';
import {
  KafkaTopic,
  KYCVerificationStatus,
} from '@repo/dto';

@Injectable()
export class KycDocumentService {
  private readonly logger = new Logger(KycDocumentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly financeService: FinanceService,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  async getKYCStatus(userId: string) {
    const documents = await this.prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const approvedCount = documents.filter(
      (d) =>
        (d.status as KYCVerificationStatus) === KYCVerificationStatus.APPROVED,
    ).length;
    const pendingCount = documents.filter(
      (d) =>
        (d.status as KYCVerificationStatus) === KYCVerificationStatus.PENDING,
    ).length;
    const rejectedCount = documents.filter(
      (d) =>
        (d.status as KYCVerificationStatus) === KYCVerificationStatus.REJECTED,
    ).length;

    return {
      userId,
      status:
        approvedCount >= 2
          ? KYCVerificationStatus.APPROVED
          : pendingCount > 0
            ? KYCVerificationStatus.PENDING
            : KYCVerificationStatus.NOT_STARTED,
      documents,
      summary: {
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount,
      },
    };
  }

  async approveDocument(documentId: string) {
    const document = await this.prisma.kYCDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    const updated = await this.prisma.kYCDocument.update({
      where: { id: documentId },
      data: { status: KYCVerificationStatus.APPROVED },
    });

    // Check if this is the second approved document (wallet activation trigger)
    const documents = await this.prisma.kYCDocument.findMany({
      where: { userId: document.userId },
    });

    const approvedCount = documents.filter(
      (d) =>
        (d.status as KYCVerificationStatus) === KYCVerificationStatus.APPROVED,
    ).length;

    // Activate wallet when 2 documents are approved
    if (approvedCount >= 2) {
      try {
        const wallet = await this.financeService.activateWallet(
          document.userId,
        );
        this.logger.log(
          `Wallet activated for user ${document.userId}: ${wallet.walletId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to activate wallet for user ${document.userId}`,
          error,
        );
        // Don't throw - wallet activation can be retried manually
      }
    }

    // Emit to Kafka for notification-worker
    try {
      await this.kafkaProducer.emit(KafkaTopic.KYC_EVENTS, {
        userId: document.userId,
        documentId,
        status: KYCVerificationStatus.APPROVED,
        timestamp: new Date().toISOString(),
        referenceId: documentId,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to emit KYC_EVENTS (APPROVED) to Kafka for user ${document.userId}: ${error.message}`,
      );
    }

    return updated;
  }

  async rejectDocument(documentId: string, reason: string) {
    const updated = await this.prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        status: KYCVerificationStatus.REJECTED,
        metadata: { reason },
      },
    });

    // Emit to Kafka for notification-worker
    try {
      await this.kafkaProducer.emit(KafkaTopic.KYC_EVENTS, {
        userId: updated.userId,
        documentId,
        status: KYCVerificationStatus.REJECTED,
        reason,
        timestamp: new Date().toISOString(),
        referenceId: documentId,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to emit KYC_EVENTS (REJECTED) to Kafka for user ${updated.userId}: ${error.message}`,
      );
    }

    return updated;
  }

  async getKYCHistory(userId: string) {
    return this.prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
