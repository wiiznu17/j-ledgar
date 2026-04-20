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

      // 1. Extract 13-digit ID Number (Pattern: x xxxx xxxxx xx x or xxxxxxxxxxxxx)
      const idMatch = fullText.match(/\d\s?\d{4}\s?\d{5}\s?\d{2}\s?\d/);
      const idCardNumber = idMatch ? idMatch[0].replace(/\s/g, '') : '';

      // 2. Extract Names (This is heuristic-based for Thai IDs which usually have "Name" "Last name" in Eng)
      // Heuristic: Look for Name/Last Name labels or capitalized words
      const lines = fullText.split('\n');
      let firstName = '';
      let lastName = '';

      for (const line of lines) {
        // Look for common patterns in English on Thai IDs
        if (line.includes('Name')) {
          firstName = line.replace(/Name|[:.-]/gi, '').trim();
        }
        if (line.includes('Last name')) {
          lastName = line.replace(/Last name|[:.-]/gi, '').trim();
        }
      }

      // 3. Date of Birth
      // Heuristic: Look for dates in format DD Month YYYY or DD.MM.YYYY
      const dobMatch = fullText.match(/\d{1,2}\s[A-Za-z]{3,9}\s\d{4}/);
      const dateOfBirth = dobMatch ? dobMatch[0] : '';
      
      const extraction: KycExtractionResult = {
        idCardNumber,
        firstName,
        lastName,
        dateOfBirth,
        address: this.extractAddress(fullText),
        rawResponse: fullText, // Store raw text for audit/refinement
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
