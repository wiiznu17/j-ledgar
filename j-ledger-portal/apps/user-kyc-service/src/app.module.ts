import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { S3Module } from './s3/s3.module';
import { KYCModule } from './kyc/kyc.module';
import { UserModule } from './user/user.module';
import { DocumentModule } from './document/document.module';
import { PIIModule } from './pii/pii.module';
import { OCRModule } from './ocr/ocr.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    S3Module,
    KYCModule,
    UserModule,
    DocumentModule,
    PIIModule,
    OCRModule,
  ],
})
export class AppModule {}
