import { IsNumber, IsPositive, IsString, IsIn } from 'class-validator';

export class TopUpDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsIn(['PROMPTPAY', 'CREDIT_CARD'])
  channel!: string;
}
