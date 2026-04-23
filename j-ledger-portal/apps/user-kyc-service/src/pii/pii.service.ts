import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PIIService {
  private encryptionKey: Buffer;
  private algorithm = 'aes-256-gcm';

  constructor(private prisma: PrismaService) {
    this.encryptionKey = Buffer.from(process.env.PII_ENCRYPTION_KEY || 'default-32-char-encryption-key-123456', 'utf8').slice(0, 32);
  }

  private encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return { encrypted, iv: iv.toString('hex'), authTag: authTag.toString('hex') };
  }

  private decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async storePII(userId: string, field: string, value: string) {
    const { encrypted, iv, authTag } = this.encrypt(value);
    const encryptedData = JSON.stringify({ encrypted, iv, authTag });

    return this.prisma.pII.upsert({
      where: {
        userId_field: {
          userId,
          field,
        },
      },
      update: {
        encryptedData,
      },
      create: {
        userId,
        field,
        encryptedData,
      },
    });
  }

  async getPII(userId: string, field: string): Promise<string | null> {
    const pii = await this.prisma.pII.findUnique({
      where: {
        userId_field: {
          userId,
          field,
        },
      },
    });

    if (!pii) return null;

    const { encrypted, iv, authTag } = JSON.parse(pii.encryptedData);
    return this.decrypt(encrypted, iv, authTag);
  }

  async deletePII(userId: string, field: string) {
    return this.prisma.pII.deleteMany({
      where: {
        userId,
        field,
      },
    });
  }
}
