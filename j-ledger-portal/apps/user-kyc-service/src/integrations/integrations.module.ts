import { Module, DynamicModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IGoogleKycProvider, IAwsKycProvider } from './interfaces/kyc-provider.interface';
import { IStorageProvider } from './interfaces/storage-provider.interface';
import { MockKycProvider } from './providers/mock-kyc.adapter';
import { GoogleKycProvider } from './providers/google-kyc.adapter';
import { AwsKycProvider } from './providers/aws-kyc.adapter';
import { S3StorageAdapter } from './providers/s3-storage.adapter';
import { S3Module } from '../s3/s3.module';

const GOOGLE_KYC_PROVIDER = 'GOOGLE_KYC_PROVIDER';
const AWS_KYC_PROVIDER = 'AWS_KYC_PROVIDER';
const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

export { GOOGLE_KYC_PROVIDER, AWS_KYC_PROVIDER, STORAGE_PROVIDER };

@Module({})
export class IntegrationsModule {
  static register(): DynamicModule {
    return {
      module: IntegrationsModule,
      imports: [S3Module],
      providers: [
        {
          provide: GOOGLE_KYC_PROVIDER,
          useFactory: (configService: ConfigService) => {
            const providerType = configService.get<string>('KYC_OCR_PROVIDER_TYPE', 'mock');

            switch (providerType) {
              case 'google':
                return new GoogleKycProvider(configService);
              case 'mock':
              default:
                return new MockKycProvider();
            }
          },
          inject: [ConfigService],
        },
        {
          provide: AWS_KYC_PROVIDER,
          useFactory: (configService: ConfigService) => {
            const providerType = configService.get<string>('KYC_FACE_PROVIDER_TYPE', 'mock');

            switch (providerType) {
              case 'aws':
                return new AwsKycProvider(configService);
              case 'mock':
              default:
                return new MockKycProvider();
            }
          },
          inject: [ConfigService],
        },
        {
          provide: STORAGE_PROVIDER,
          useClass: S3StorageAdapter,
        },
      ],
      exports: [GOOGLE_KYC_PROVIDER, AWS_KYC_PROVIDER, STORAGE_PROVIDER],
      global: true,
    };
  }
}
