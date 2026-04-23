import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class DocumentService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async uploadDocument(userId: string, file: Express.Multer.File, documentType: string) {
    const s3Key = `kyc/${userId}/${documentType}/${Date.now()}-${file.originalname}`;
    const s3Url = await this.s3Service.uploadFile(s3Key, file.buffer, file.mimetype);

    return this.prisma.kYCDocument.create({
      data: {
        userId,
        documentType,
        status: 'PENDING',
        s3Key,
        s3Url,
      },
    });
  }

  async getDocuments(userId: string) {
    return this.prisma.kYCDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
