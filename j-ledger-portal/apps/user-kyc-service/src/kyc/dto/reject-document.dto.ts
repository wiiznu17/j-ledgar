import { IsString } from 'class-validator';

export class RejectDocumentDto {
  @IsString()
  reason: string;
}
