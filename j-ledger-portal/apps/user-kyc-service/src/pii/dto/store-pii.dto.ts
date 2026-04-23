import { IsString, IsEnum } from 'class-validator';

export enum PIIField {
  FULL_NAME = 'FULL_NAME',
  ID_NUMBER = 'ID_NUMBER',
  ADDRESS = 'ADDRESS',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  TAX_ID = 'TAX_ID',
}

export class StorePIIDto {
  @IsString()
  userId: string;

  @IsEnum(PIIField)
  field: PIIField;

  @IsString()
  value: string;
}
