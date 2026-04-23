import { IsString, IsEnum } from 'class-validator';

export enum DocumentType {
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
  SELFIE = 'SELFIE',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
}

export class UploadDocumentDto {
  @IsString()
  userId: string;

  @IsEnum(DocumentType)
  documentType: DocumentType;
}
