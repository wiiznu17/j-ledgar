import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ScanPayDto {
  @IsString()
  @IsNotEmpty()
  qrCodeData: string;

  @IsNumber()
  @Min(0.01)
  amount: number;
}
