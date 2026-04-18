import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TextractClient,
  AnalyzeDocumentCommand,
  FeatureType,
  Query,
} from '@aws-sdk/client-textract';
import {
  RekognitionClient,
  CompareFacesCommand,
} from '@aws-sdk/client-rekognition';
import {
  IKycProvider,
  KycCompareResult,
  KycExtractionResult,
} from '../../interfaces/kyc-provider.interface';

@Injectable()
export class AwsKycAdapter implements IKycProvider {
  private readonly logger = new Logger(AwsKycAdapter.name);
  private readonly textract: TextractClient;
  private readonly rekognition: RekognitionClient;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('AWS Credentials missing for AwsKycAdapter');
    }

    const credentials = { accessKeyId, secretAccessKey };

    this.textract = new TextractClient({ region, credentials });
    this.rekognition = new RekognitionClient({ region, credentials });
  }

  async extractIdData(idCardImage: Buffer): Promise<KycExtractionResult> {
    this.logger.log('Performing AWS Textract OCR with Queries for Identity Document...');

    // Define specific queries for Thai ID accuracy (English fields for standardization)
    const queries: Query[] = [
      { Text: 'What is the Identification Number?', Alias: 'ID_NUMBER' },
      { Text: 'What is the English First Name?', Alias: 'FIRST_NAME' },
      { Text: 'What is the English Last Name?', Alias: 'LAST_NAME' },
      { Text: 'What is the Date of Birth?', Alias: 'DOB' },
    ];

    try {
      const command = new AnalyzeDocumentCommand({
        Document: { Bytes: idCardImage },
        FeatureTypes: [FeatureType.QUERIES],
        QueriesConfig: { Queries: queries },
      });

      const response = await this.textract.send(command);
      
      const result: Partial<KycExtractionResult> = {
        rawResponse: response,
      };

      // Map query results to the result object
      if (response.Blocks) {
        const queryResultBlocks = response.Blocks.filter(b => b.BlockType === 'QUERY_RESULT');
        const queryBlocks = response.Blocks.filter(b => b.BlockType === 'QUERY');

        for (const q of queries) {
          const queryBlock = queryBlocks.find(b => b.Query?.Alias === q.Alias);
          const firstRelationship = queryBlock?.Relationships?.[0];
          const firstId = firstRelationship?.Ids?.[0];

          if (firstId) {
            const resultBlock = queryResultBlocks.find(b => b.Id === firstId);
            const value = resultBlock?.Text || '';
            
            if (q.Alias === 'ID_NUMBER') result.idCardNumber = value.replace(/\s/g, '');
            if (q.Alias === 'FIRST_NAME') result.firstName = value;
            if (q.Alias === 'LAST_NAME') result.lastName = value;
            if (q.Alias === 'DOB') result.dateOfBirth = value;
          }
        }
      }

      if (!result.idCardNumber) {
        throw new InternalServerErrorException('Failed to extract Identity Number from document');
      }

      return result as KycExtractionResult;
    } catch (error: any) {
      this.logger.error(`AWS Textract Error: ${error.message}`);
      throw new InternalServerErrorException('Identity document extraction failed');
    }
  }

  async compareFaces(selfie: Buffer, idCard: Buffer): Promise<KycCompareResult> {
    this.logger.log('Performing AWS Rekognition Face Comparison...');

    try {
      const command = new CompareFacesCommand({
        SourceImage: { Bytes: idCard },
        TargetImage: { Bytes: selfie },
        SimilarityThreshold: 80, // Industry standard threshold
      });

      const response = await this.rekognition.send(command);
      
      const match = response.FaceMatches?.[0];
      
      return {
        isMatch: !!match && (match.Similarity || 0) >= 90, // We require 90% for high-trust Fintech
        score: match?.Similarity || 0,
      };
    } catch (error: any) {
      this.logger.error(`AWS Rekognition Error: ${error.message}`);
      throw new InternalServerErrorException('Face comparison verification failed');
    }
  }
}
