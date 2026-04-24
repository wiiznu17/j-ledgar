import { Injectable, Inject } from '@nestjs/common';
import { IStorageProvider } from '../interfaces/storage-provider.interface';
import { S3Service } from '../../s3/s3.service';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3StorageAdapter implements IStorageProvider {
  constructor(
    @Inject(S3Service) private readonly s3Service: S3Service,
  ) {}

  async uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    return this.s3Service.uploadFile(key, buffer, contentType);
  }

  async downloadFile(url: string): Promise<Buffer> {
    // Extract key from URL
    const key = this.extractKeyFromUrl(url);
    return this.s3Service.getFile(key);
  }

  async deleteFile(key: string): Promise<void> {
    // TODO: Implement delete functionality in S3Service or add it here
    // const command = new DeleteObjectCommand({
    //   Bucket: this.s3Service['bucketName'],
    //   Key: key,
    // });
    // await this.s3Service['s3Client'].send(command);
    throw new Error('Delete file not yet implemented');
  }

  private extractKeyFromUrl(url: string): string {
    // URL format: https://bucket-name.s3.amazonaws.com/key
    const parts = url.split('.s3.amazonaws.com/');
    if (parts.length < 2) {
      throw new Error('Invalid S3 URL format');
    }
    return parts[1];
  }
}
