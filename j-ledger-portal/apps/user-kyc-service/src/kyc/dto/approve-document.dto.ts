import { IsString, IsOptional } from 'class-validator';

export class ApproveDocumentDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
