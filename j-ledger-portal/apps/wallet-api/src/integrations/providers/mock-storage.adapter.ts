import { Injectable, Logger } from '@nestjs/common';
import { IStorageProvider } from '../interfaces/storage-provider.interface';

@Injectable()
export class MockStorageAdapter implements IStorageProvider {
  private readonly logger = new Logger(MockStorageAdapter.name);

  async uploadFile(key: string, file: Buffer, contentType: string): Promise<string> {
    this.logger.log(`[MOCK STORAGE] Uploading ${key} (${file.length} bytes, type: ${contentType})`);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return `mock-storage://${key}`;
  }

  async downloadFile(key: string): Promise<Buffer> {
    this.logger.log(`[MOCK STORAGE] Downloading ${key}`);
    return Buffer.from('mock-file-content');
  }

  async deleteFile(key: string): Promise<void> {
    this.logger.log(`[MOCK STORAGE] Deleting ${key}`);
  }

  async getSignedUrl(key: string, expires: number = 3600): Promise<string> {
    this.logger.log(`[MOCK STORAGE] Generating signed URL for ${key} (expires: ${expires}s)`);
    return `https://mock-storage.local/${key}?token=mock-token`;
  }
}
