import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { AddressType, AddressVerificationSource } from '@prisma/client';

export class UpdateAddressDto {
  @IsString()
  @IsOptional()
  line1?: string;

  @IsString()
  @IsOptional()
  line2?: string;

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

  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  countryCode?: string;
}

export class AddressResponseDto {
  id: string;
  userId: string;
  type: AddressType;
  label?: string;
  line1?: string;
  line2?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  countryCode: string;
  isVerified: boolean;
  verifiedAt?: Date;
  verificationSource?: AddressVerificationSource;
  createdAt: Date;
}
