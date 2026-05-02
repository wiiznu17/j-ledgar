import { Injectable, Inject } from '@nestjs/common';
import { IStorageProvider, STORAGE_PROVIDER } from './storage.interface';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: IStorageProvider,
  ) {}

  async uploadImage(
    file: Buffer,
    fileName: string,
    mimeType: string,
    folder: 'deals' | 'banners' | 'profiles' = 'deals',
  ) {
    return this.storageProvider.uploadFile(file, fileName, mimeType, folder);
  }

  async deleteFile(key: string) {
    return this.storageProvider.deleteFile(key);
  }
}
