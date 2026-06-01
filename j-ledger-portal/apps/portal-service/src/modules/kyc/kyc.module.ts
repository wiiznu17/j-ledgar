import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { IntegrationModule } from '../integration/integration.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { IdentityModule } from '../identity/identity.module';
import { NotificationModule } from '../notification/notification.module';

import { S3Service } from './services/s3.service';
import { GoogleVisionService } from './services/ocr.service';
import { AwsRekognitionService } from './services/face.service';

import { KycCryptoService } from './services/kyc-crypto.service';
import { KycDocumentService } from './services/kyc-document.service';
import { KycAdminService } from './services/kyc-admin.service';
import { KycProcessService } from './services/kyc-process.service';

@Module({
  imports: [
    IntegrationModule,
    JwtModule.register({}),
    ConfigModule,
    IdentityModule,
    NotificationModule,
  ],
  providers: [
    KycService,
    S3Service,
    GoogleVisionService,
    AwsRekognitionService,
    KycCryptoService,
    KycDocumentService,
    KycAdminService,
    KycProcessService,
  ],
  exports: [
    KycService,
    S3Service,
    GoogleVisionService,
    AwsRekognitionService,
    KycCryptoService,
    KycDocumentService,
    KycAdminService,
    KycProcessService,
  ],
})
export class KycModule {}
