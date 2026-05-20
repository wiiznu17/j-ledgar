import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsObject,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

// Thai characters, spaces, numbers, and common symbols like . ( ) / -
const THAI_NAME_REGEX = /^[ก-๙\s0-9.()/-]+$/;
const TAX_ID_REGEX = /^\d{13}$/;
const PHONE_REGEX = /^\d{9,10}$/;

export class PartnerProfileDto {
  @IsString()
  @IsOptional()
  businessNameEn?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsNotEmpty({ message: 'Contact name is required' })
  contactName: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Contact email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Contact phone is required' })
  @Matches(PHONE_REGEX, { message: 'Phone number must be 9-10 digits' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Registered address is required' })
  address: string;

  @IsString()
  @IsOptional()
  addressDetail?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsObject()
  @IsOptional()
  location?: any;
}

export class CreatePartnerDto {
  @IsString()
  @IsNotEmpty({ message: 'Corporate name (Thai) is required' })
  @Matches(THAI_NAME_REGEX, {
    message:
      'Corporate name must contain only Thai characters, numbers, and valid symbols',
  })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Tax ID is required' })
  @Matches(TAX_ID_REGEX, { message: 'Tax ID must be exactly 13 digits' })
  taxId: string;

  @IsObject()
  @IsNotEmpty({ message: 'Partner profile is required' })
  @ValidateNested()
  @Type(() => PartnerProfileDto)
  profile: PartnerProfileDto;
}

export class UpdatePartnerDto {
  @IsString()
  @IsOptional()
  @Matches(THAI_NAME_REGEX, {
    message:
      'Corporate name must contain only Thai characters, numbers, and valid symbols',
  })
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(TAX_ID_REGEX, { message: 'Tax ID must be exactly 13 digits' })
  taxId?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PartnerProfileDto)
  profile?: PartnerProfileDto;
}
