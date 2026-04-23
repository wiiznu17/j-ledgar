import { Injectable } from '@nestjs/common';
import { ImageAnnotatorClient } from '@google-cloud/vision';

@Injectable()
export class OCRService {
  private client: ImageAnnotatorClient;

  constructor() {
    this.client = new ImageAnnotatorClient();
  }

  async extractTextFromImage(imageBuffer: Buffer): Promise<string> {
    const [result] = await this.client.documentTextDetection({
      image: { content: imageBuffer },
    });

    const fullTextAnnotation = result.fullTextAnnotation;
    return fullTextAnnotation.text || '';
  }

  async extractThaiIDData(imageBuffer: Buffer): Promise<{
    idNumber?: string;
    name?: string;
    lastName?: string;
    address?: string;
    issueDate?: string;
    expiryDate?: string;
  }> {
    const text = await this.extractTextFromImage(imageBuffer);

    // Custom parsing for Thai ID card
    // Note: This is a basic implementation. In production, you may need more sophisticated parsing
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);

    const result: any = {};

    for (const line of lines) {
      // Thai ID number pattern (13 digits)
      const idMatch = line.match(/\d{13}/);
      if (idMatch) {
        result.idNumber = idMatch[0];
      }

      // Name (Thai)
      const nameMatch = line.match(/ชื่อ[:\s]+(.+)/);
      if (nameMatch) {
        result.name = nameMatch[1].trim();
      }

      // Last name (Thai)
      const lastNameMatch = line.match(/นามสกุล[:\s]+(.+)/);
      if (lastNameMatch) {
        result.lastName = lastNameMatch[1].trim();
      }

      // Address
      const addressMatch = line.match(/ที่อยู่[:\s]+(.+)/);
      if (addressMatch) {
        result.address = addressMatch[1].trim();
      }

      // Issue date (Thai format: วันออกบัตร)
      const issueDateMatch = line.match(/วันออกบัตร[:\s]+(.+)/);
      if (issueDateMatch) {
        result.issueDate = issueDateMatch[1].trim();
      }

      // Expiry date (Thai format: วันหมดอายุ)
      const expiryDateMatch = line.match(/วันหมดอายุ[:\s]+(.+)/);
      if (expiryDateMatch) {
        result.expiryDate = expiryDateMatch[1].trim();
      }
    }

    return result;
  }
}
