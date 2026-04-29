import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

  @IsString()
  @IsOptional()
  registeredAddress?: string;
}
