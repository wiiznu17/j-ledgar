export interface IdCardExtraction {
  idCardNumber?: string;
  firstName?: string;
  lastName?: string;
  thaiName?: string;
  prefix?: string;
  dateOfBirth?: string;
  idCardIssueDate?: string;
  idCardExpiryDate?: string;
  religion?: string;
  address?: string;
}

export interface LivenessSession {
  sessionId: string;
  isLive: boolean;
  confidence?: number;
}

export interface FaceComparison {
  isMatch: boolean;
  score: number;
}

export interface IKycProvider {
  extractIdData(imageBuffer: Buffer): Promise<IdCardExtraction>;
}

export interface IGoogleKycProvider extends IKycProvider {
  // Google Vision specific methods if needed
}

export interface IAwsKycProvider {
  createLivenessSession(): Promise<string>;
  getLivenessResult(sessionId: string): Promise<LivenessSession>;
  compareFaces(selfieBuffer: Buffer, idCardBuffer: Buffer): Promise<FaceComparison>;
}
