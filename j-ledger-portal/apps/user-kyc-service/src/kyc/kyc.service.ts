import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KYCService {
  constructor(private prisma: PrismaService) {}

  async getKYCStatus(userId: string) {
    const documents = await this.prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const approvedCount = documents.filter((d) => d.status === 'APPROVED').length;
    const pendingCount = documents.filter((d) => d.status === 'PENDING').length;
    const rejectedCount = documents.filter((d) => d.status === 'REJECTED').length;

    return {
      userId,
      status: approvedCount >= 2 ? 'VERIFIED' : pendingCount > 0 ? 'PENDING' : 'NOT_STARTED',
      documents,
      summary: {
        approved: approvedCount,
        pending: pendingCount,
        rejected: rejectedCount,
      },
    };
  }

  async approveDocument(documentId: string) {
    return this.prisma.kYCDocument.update({
      where: { id: documentId },
      data: { status: 'APPROVED' },
    });
  }

  async rejectDocument(documentId: string, reason: string) {
    return this.prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        status: 'REJECTED',
        metadata: { reason },
      },
    });
  }

  async getPendingKYCList() {
    return this.prisma.kYCDocument.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getKYCHistory(userId: string) {
    return this.prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
