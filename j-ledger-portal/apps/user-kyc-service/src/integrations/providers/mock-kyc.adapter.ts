import { Injectable, Inject } from '@nestjs/common';
import { IKycProvider, IGoogleKycProvider, IAwsKycProvider, IdCardExtraction, LivenessSession, FaceComparison } from '../interfaces/kyc-provider.interface';

@Injectable()
export class MockKycProvider implements IGoogleKycProvider, IAwsKycProvider {
  async extractIdData(imageBuffer: Buffer): Promise<IdCardExtraction> {
    // Mock OCR extraction for development
    return {
      idCardNumber: '1100012345678',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      thaiName: 'สมชาย ใจดี',
      prefix: 'นาย',
      dateOfBirth: '01/01/1990',
      idCardIssueDate: '01/01/2015',
      idCardExpiryDate: '01/01/2030',
      religion: 'พุทธ',
      address: '123 ถนนสุขุมวิท กรุงเทพฯ',
    };
  }

  async createLivenessSession(): Promise<string> {
    return `mock-session-${Date.now()}`;
  }

  async getLivenessResult(sessionId: string): Promise<LivenessSession> {
    return {
      sessionId,
      isLive: true,
      confidence: 0.95,
    };
  }

  async compareFaces(selfieBuffer: Buffer, idCardBuffer: Buffer): Promise<FaceComparison> {
    return {
      isMatch: true,
      score: 95,
    };
  }
}
