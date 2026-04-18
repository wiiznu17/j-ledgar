import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';
import { TransferRequest } from '@repo/dto';

export class TransferDto implements TransferRequest {
  @IsString()
  @IsNotEmpty()
  fromAccountId!: string;

  @IsString()
  @IsNotEmpty()
  toAccountId!: string;

  @IsNumberString()
  @IsNotEmpty()
  amount!: string;

  @IsString()
  @IsNotEmpty()
  currency!: string;
}
