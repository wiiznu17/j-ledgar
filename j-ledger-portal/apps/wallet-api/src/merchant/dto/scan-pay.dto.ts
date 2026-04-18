import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ScanPayRequest } from '@repo/dto';

export class ScanPayDto implements ScanPayRequest {
  @IsString()
  @IsNotEmpty()
  qrCodeData!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;
}
