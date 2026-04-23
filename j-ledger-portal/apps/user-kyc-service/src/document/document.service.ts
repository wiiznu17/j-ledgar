import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { OCRService } from '../ocr/ocr.service';

@Injectable()
export class DocumentService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private ocrService: OCRService,
  ) {}

  private validateFile(file: Express.Multer.File) {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images and PDF are allowed');
    }
  }

  async uploadDocument(userId: string, file: Express.Multer.File, documentType: string) {
    this.validateFile(file);

    const s3Key = `kyc/${userId}/${documentType}/${Date.now()}-${file.originalname}`;
    const s3Url = await this.s3Service.uploadFile(s3Key, file.buffer, file.mimetype);

    // Extract OCR data if it's an image
    let ocrData = null;
    if (file.mimetype.startsWith('image/')) {
      try {
        ocrData = await this.ocrService.extractThaiIDData(file.buffer);
      } catch (error) {
        console.error('OCR extraction failed:', error);
      }
    }

    return this.prisma.kYCDocument.create({
      data: {
        userId,
        documentType,
        status: 'PENDING',
        s3Key,
        s3Url,
        metadata: ocrData,
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
