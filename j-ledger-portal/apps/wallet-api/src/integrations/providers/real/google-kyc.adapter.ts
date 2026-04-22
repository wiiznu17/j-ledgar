import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import {
  IKycProvider,
  KycCompareResult,
  KycExtractionResult,
} from '../../interfaces/kyc-provider.interface';

@Injectable()
export class GoogleKycAdapter implements IKycProvider {
  private readonly logger = new Logger(GoogleKycAdapter.name);
  private readonly client: ImageAnnotatorClient;

  constructor(private readonly configService: ConfigService) {
    // google-cloud/vision automatically picks up credentials from GOOGLE_APPLICATION_CREDENTIALS env
    this.client = new ImageAnnotatorClient();
  }

  async extractIdData(idCardImage: Buffer): Promise<KycExtractionResult> {
    this.logger.log('Performing Google Cloud Vision OCR for Thai ID Card...');

    try {
      const [result] = await this.client.textDetection(idCardImage);
      const detections = result.textAnnotations;
      
      if (!detections || detections.length === 0 || !detections[0]) {
        throw new InternalServerErrorException('No text detected on the ID card image');
      }

      const fullText = detections[0].description || '';
      this.logger.debug(`Extracted Full Text: ${fullText.replace(/\n/g, ' ')}`);

      // 1. Extract 13-digit ID Number
      const idMatch = fullText.match(/\d\s?\d{4}\s?\d{5}\s?\d{2}\s?\d/);
      const idCardNumber = idMatch ? idMatch[0].replace(/\s/g, '') : '';

      // 2. Extract Names and Prefixes
      const lines = fullText.split('\n');
      let firstName = '';
      let lastName = '';
      let thaiName = '';
      let prefix = '';

      for (const line of lines) {
        // Thai Name Extraction (Heuristic: Look for Thai characters after label)
        if (line.includes('ชื่อตัวและชื่อสกุล') || line.match(/[ก-ู] [ก-ู]/)) {
           const cleaned = line.replace(/ชื่อตัวและชื่อสกุล|[:.-]/gi, '').trim();
           if (cleaned.match(/^[ก-๙\s]+$/)) {
             thaiName = cleaned;
             const prefixMatch = thaiName.match(/^(นาย|นาง|นางสาว|เด็กชาย|เด็กหญิง)/);
             if (prefixMatch) prefix = prefixMatch[0];
           }
        }

        // English Name Extraction
        if (line.includes('Name')) {
          firstName = line.replace(/Name|[:.-]/gi, '').trim();
        }
        if (line.includes('Last name')) {
          lastName = line.replace(/Last name|[:.-]/gi, '').trim();
        }
      }

      // 3. Religion
      const religionMatch = fullText.match(/ศาสนา\s?([ก-๙]+)/);
      const religion = religionMatch ? religionMatch[1] : '';

      // 4. Dates (DOB, Issue, Expiry) - Support both Eng and Thai/B.E.
      const extraction: KycExtractionResult = {
        idCardNumber,
        firstName,
        lastName,
        thaiName,
        prefix,
        dateOfBirth: this.extractDate(fullText, 'เกิด'),
        idCardIssueDate: this.extractDate(fullText, 'ออกบัตร'),
        idCardExpiryDate: this.extractDate(fullText, 'หมดอายุ'),
        religion,
        address: this.extractAddress(fullText),
        rawResponse: fullText,
      };

      if (!extraction.idCardNumber) {
        this.logger.warn('Identity number not found in OCR result. Confidence might be low.');
      }

      return extraction;
    } catch (error: any) {
      this.logger.error(`Google Vision Error: ${error.message}`);
      throw new InternalServerErrorException('Identity document OCR failed via Google Cloud');
    }
  }

  private extractDate(text: string, label: string): string {
    // Look for patterns like 12 ม.ค. 2567 or 12 Jan. 2024
    const regex = new RegExp(`${label}.*?(\\d{1,2})\\s?([ก-๙A-Za-z.]+)\\s?(\\d{4})`, 'i');
    const match = text.match(regex);
    if (!match) return '';

    const day = match[1]!;
    const month = match[2]!;
    const yearStr = match[3]!;
    let year = parseInt(yearStr);

    // Convert B.E. to A.D.
    if (year > 2400) {
      year -= 543;
    }

    return `${day}/${month}/${year}`;
  }

  // Placeholder for Face Comparison as Google Vision doesn't do this (Rekognition used instead)
  async compareFaces(selfie: Buffer, idCard: Buffer): Promise<KycCompareResult> {
    throw new Error('GoogleKycAdapter does not support face comparison. Use AwsKycAdapter.');
  }

  private extractAddress(text: string): string {
    // Simple heuristic: Look for lines containing numbers/districts etc.
    // In a real app, this would be much more sophisticated or use a specialized model
    const lines = text.split('\n');
    const addressLines = lines.filter(l => /\d+\/\d+|หมู่ที่|ต\.|อ\.|จ\./.test(l));
    return addressLines.join(', ');
  }
}
