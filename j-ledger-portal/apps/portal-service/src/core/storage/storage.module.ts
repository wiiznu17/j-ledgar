import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { STORAGE_PROVIDER } from './storage.interface';
import { S3StorageProvider } from './s3-storage.provider';

@Global()
@Module({
  providers: [
    StorageService,
    {
      provide: STORAGE_PROVIDER,
      useClass: S3StorageProvider,
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
