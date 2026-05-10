import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OcrAddressDto {
  @IsString()
  @IsOptional()
  line1?: string;

  @IsString()
  @IsOptional()
  subdistrict?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;
}

export class ConfirmOcrDto {
  @IsString()
  @IsNotEmpty()
  idNumber!: string;

  @IsString()
  @IsOptional()
  issueDate?: string;

  @IsString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  prefixTh?: string;

  @IsString()
  @IsNotEmpty()
  firstNameTh!: string;

  @IsString()
  @IsNotEmpty()
  lastNameTh!: string;

  @IsString()
  @IsOptional()
  prefixEn?: string;

  @IsString()
  @IsNotEmpty()
  firstNameEn!: string;

  @IsString()
  @IsNotEmpty()
  lastNameEn!: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  religion?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OcrAddressDto)
  registeredAddress?: OcrAddressDto;
}
