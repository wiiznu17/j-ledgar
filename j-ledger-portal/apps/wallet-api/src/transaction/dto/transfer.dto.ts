import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class TransferDto {
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
