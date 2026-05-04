import { Injectable, Logger } from '@nestjs/common';
import { 
  RekognitionClient, 
  CompareFacesCommand, 
  CreateFaceLivenessSessionCommand, 
  GetFaceLivenessSessionResultsCommand 
} from '@aws-sdk/client-rekognition';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AwsRekognitionService {
  private readonly client: RekognitionClient;
  private readonly logger = new Logger(AwsRekognitionService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new RekognitionClient({
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async createLivenessSession() {
    try {
      const command = new CreateFaceLivenessSessionCommand({});
      const response = await this.client.send(command);
      return response.SessionId;
    } catch (error) {
      this.logger.error('Failed to create AWS Liveness session', error);
      throw error;
    }
  }

  async getLivenessResults(sessionId: string) {
    try {
      const command = new GetFaceLivenessSessionResultsCommand({
        SessionId: sessionId,
      });
      const response = await this.client.send(command);
      return {
        status: response.Status,
        confidence: response.Confidence,
        referenceImage: response.ReferenceImage,
      };
    } catch (error) {
      this.logger.error(`Failed to get results for session ${sessionId}`, error);
      throw error;
    }
  }

  async compareFaces(sourceImage: Buffer, targetImage: Buffer) {
    try {
      const command = new CompareFacesCommand({
        SourceImage: { Bytes: sourceImage },
        TargetImage: { Bytes: targetImage },
        SimilarityThreshold: Number(this.configService.get('KYC_MIN_SIMILARITY_SCORE', 80)),
      });

      const response = await this.client.send(command);
      const match = response.FaceMatches?.[0];

      return {
        isMatch: !!match,
        similarity: match?.Similarity || 0,
      };
    } catch (error) {
      this.logger.error('Face comparison error', error);
      throw error;
    }
  }
}
