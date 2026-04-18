import { Injectable, Logger, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  S3Client, 
  PutObjectCommand, 
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageProvider } from '../../interfaces/storage-provider.interface';

@Injectable()
export class S3StorageAdapter implements IStorageProvider, OnModuleInit {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    this.bucket = this.configService.get<string>('S3_BUCKET') || 'jledger-assets';

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('S3 Credentials missing for S3StorageAdapter');
    }

    this.s3 = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      endpoint, // Used for MinIO or custom S3 providers
      forcePathStyle: !!endpoint, // Required for MinIO
    });
  }

  async onModuleInit() {
    // Dev-only auto-creation logic for MinIO compliance
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const isLocal = endpoint && (endpoint.includes('localhost') || endpoint.includes('minio'));
    
    if (isLocal) {
      this.logger.log(`Local/MinIO endpoint detected (${endpoint}). Ensuring bucket "${this.bucket}" exists...`);
      try {
        await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      } catch (error: any) {
        if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
          this.logger.warn(`Bucket "${this.bucket}" not found. Creating now for local development...`);
          await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        } else {
          this.logger.error(`Failed to verify S3 bucket: ${error.message}`);
        }
      }
    }
  }

  async uploadFile(key: string, file: Buffer, contentType: string): Promise<string> {
    this.logger.log(`Uploading to S3: ${this.bucket}/${key} (${contentType})`);

    try {
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      }));

      return `s3://${this.bucket}/${key}`;
    } catch (error: any) {
      this.logger.error(`S3 Upload Error: ${error.message}`);
      throw new InternalServerErrorException('Asset storage failed');
    }
  }

  async getSignedUrl(key: string, expires: number = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({ Bucket: this.bucket, Key: key });
      return await getSignedUrl(this.s3, command, { expiresIn: expires });
    } catch (error: any) {
      this.logger.error(`S3 Presign Error: ${error.message}`);
      throw new InternalServerErrorException('Failed to generate temporary access link');
    }
  }
}
