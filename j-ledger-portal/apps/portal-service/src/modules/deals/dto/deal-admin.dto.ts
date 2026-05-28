import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsUrl,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  partnerId?: string | null;
}

export class UpdateBrandDto extends CreateBrandDto {}

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  iconUrl?: string;

  @IsNumber()
  @IsOptional()
  order?: number;
}

export class UpdateCategoryDto extends CreateCategoryDto {}

export class CreateDealDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsNumber()
  @Min(0)
  pointsRequired: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  brandId: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsNumber()
  @IsOptional()
  priority?: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  termsCondition?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  limitPerUser?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateDealDto extends CreateDealDto {}
