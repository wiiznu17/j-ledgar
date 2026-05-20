import { IsString, IsNotEmpty, Length, IsOptional } from 'class-validator';

export class ApplyMerchantDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  businessName: string;

  @IsString()
  @IsOptional()
  @Length(0, 100)
  businessNameEn?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  salesChannel: string;

  @IsString()
  @IsNotEmpty()
  contactName: string;

  @IsString()
  @IsOptional() // TODO: Make optional temporarily, should be required in production
  email?: string;

  @IsString()
  @IsNotEmpty()
  @Length(9, 10)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 13)
  taxId: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  addressDetail?: string;

  @IsString()
  @IsOptional()
  latitude?: string;

  @IsString()
  @IsOptional()
  longitude?: string;

  @IsString()
  @IsOptional()
  ownerIdCardNumber?: string;

  @IsString()
  @IsOptional()
  ownerBirthDate?: string;

  @IsOptional()
  images?: string[];
}
