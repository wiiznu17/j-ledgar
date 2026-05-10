import { Module } from '@nestjs/common';
import { KycService } from './kyc.service';
import { KycController } from '../../user/kyc/kyc.controller';
import { IntegrationModule } from '../integration/integration.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { IdentityModule } from '../identity/identity.module';
import { NotificationModule } from '../notification/notification.module';

import { S3Service } from './services/s3.service';
import { GoogleVisionService } from './services/ocr.service';
import { AwsRekognitionService } from './services/face.service';

@Module({
  imports: [
    IntegrationModule,
    JwtModule.register({}),
    ConfigModule,
    IdentityModule,
    NotificationModule,
  ],
  controllers: [KycController],
  providers: [
    KycService,
    S3Service,
    GoogleVisionService,
    AwsRekognitionService,
  ],
  exports: [KycService, S3Service, GoogleVisionService, AwsRekognitionService],
})
export class KycModule {}
