export interface KycExtractionResult {
  idCardNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address?: string;
  rawResponse?: any;
}

export interface KycCompareResult {
  isMatch: boolean;
  score: number;
}

export interface IKycProvider {
  /**
   * Extracts data from an identity document image.
   * @param idCardImage Buffer or Stream of the ID card image.
   */
  extractIdData(idCardImage: Buffer): Promise<KycExtractionResult>;

  /**
   * Compares a selfie image against the photo on an ID card.
   * @param selfie Image buffer of the live selfie.
   * @param idCard Image buffer of the ID card.
   */
  compareFaces(selfie: Buffer, idCard: Buffer): Promise<KycCompareResult>;
}

export const IKycProvider = Symbol('IKycProvider');
