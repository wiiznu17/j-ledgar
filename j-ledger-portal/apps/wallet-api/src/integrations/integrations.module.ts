import { Module, Global, Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISmsProvider } from './interfaces/sms-provider.interface';
import { IKycProvider } from './interfaces/kyc-provider.interface';
import { IStorageProvider } from './interfaces/storage-provider.interface';

// Mock Adapters
import { MockSmsAdapter } from './providers/mock-sms.adapter';
import { MockKycAdapter } from './providers/mock-kyc.adapter';
import { MockStorageAdapter } from './providers/mock-storage.adapter';

// Real Adapters
import { TwilioSmsAdapter } from './providers/real/twilio-sms.adapter';
import { AwsKycAdapter } from './providers/real/aws-kyc.adapter';
import { S3StorageAdapter } from './providers/real/s3-storage.adapter';

@Global()
@Module({
  providers: [
    {
      provide: ISmsProvider,
      useFactory: (config: ConfigService) => {
        const type = config.get<string>('SMS_PROVIDER_TYPE') || 'mock';
        if (type === 'twilio') {
          validateConfig(config, ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_SENDER_ID']);
          return new TwilioSmsAdapter(config);
        }
        return new MockSmsAdapter();
      },
      inject: [ConfigService],
    },
    {
      provide: IKycProvider,
      useFactory: (config: ConfigService) => {
        const type = config.get<string>('KYC_PROVIDER_TYPE') || 'mock';
        if (type === 'aws') {
          validateConfig(config, ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']);
          return new AwsKycAdapter(config);
        }
        return new MockKycAdapter();
      },
      inject: [ConfigService],
    },
    {
      provide: IStorageProvider,
      useFactory: (config: ConfigService) => {
        const type = config.get<string>('STORAGE_PROVIDER_TYPE') || 'mock';
        if (type === 's3') {
          validateConfig(config, ['S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET']);
          return new S3StorageAdapter(config);
        }
        return new MockStorageAdapter();
      },
      inject: [ConfigService],
    },
  ],
  exports: [ISmsProvider, IKycProvider, IStorageProvider],
})
export class IntegrationsModule {}

/**
 * Helper to strictly validate environment variables ONLY when a specific provider is active.
 * Prevents the app from crashing on missing AWS keys if the user is using Mocks.
 */
function validateConfig(config: ConfigService, requiredKeys: string[]) {
  const missing = requiredKeys.filter((key) => !config.get(key));
  if (missing.length > 0) {
    const logger = new Logger('IntegrationsModule');
    logger.error(`Critical configuration error: One or more providers are set to 'real' but missing mandated keys: ${missing.join(', ')}`);
    // Throw error to trigger fail-fast startup
    throw new Error(`Missing integration keys: ${missing.join(', ')}`);
  }
}
