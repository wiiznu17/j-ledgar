import { Injectable, Logger } from '@nestjs/common';
import { IKycProvider, KycCompareResult, KycExtractionResult } from '../interfaces/kyc-provider.interface';

@Injectable()
export class MockKycAdapter implements IKycProvider {
  private readonly logger = new Logger(MockKycAdapter.name);

  async extractIdData(idCardImage: Buffer): Promise<KycExtractionResult> {
    this.logger.log(`[MOCK KYC] Extracting data from image (${idCardImage.length} bytes)`);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      idCardNumber: `1${Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0')}`,
      firstName: 'Mock',
      lastName: 'User',
      dateOfBirth: '1990-01-01',
      address: '123 Mock St, Bangkok, Thailand',
    };
  }

  async compareFaces(selfie: Buffer, idCard: Buffer): Promise<KycCompareResult> {
    this.logger.log(`[MOCK KYC] Comparing faces: selfie (${selfie.length} bytes) vs ID (${idCard.length} bytes)`);
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      isMatch: true,
      score: 0.98,
    };
  }
}
