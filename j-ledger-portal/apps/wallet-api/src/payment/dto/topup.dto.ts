import { IsNumber, IsPositive, IsString, IsIn } from 'class-validator';
import { TopUpRequest } from '@repo/dto';

export class TopUpDto implements TopUpRequest {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsIn(['PROMPTPAY', 'CREDIT_CARD'])
  channel!: string;

  @IsString()
  accountId!: string;
}
