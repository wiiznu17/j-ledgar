import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReviewStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class ReviewApplicationDto {
  @ApiProperty({ enum: ReviewStatus, example: ReviewStatus.APPROVED })
  @IsEnum(ReviewStatus, { message: 'Status must be either APPROVED or REJECTED' })
  status: ReviewStatus;

  @ApiProperty({ example: 'KYC verified successfully', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  note?: string;
}
