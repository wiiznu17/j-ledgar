import { IsNumber, IsString, Min, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TerminalPaymentDto {
  @ApiProperty({ example: 100.0, description: 'Payment amount' })
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than zero' })
  amount: number;

  @ApiProperty({
    example: 'req_1234567890abcdef',
    description: 'Unique idempotency key',
  })
  @IsString()
  @Length(16, 64, {
    message: 'Idempotency key must be between 16 and 64 characters',
  })
  idempotencyKey: string;

  @ApiProperty({ example: 'Lunch payment', required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ example: 'PAY-E7A4F8B2', description: 'Customer Pay Token or User UUID', required: false })
  @IsString()
  @IsOptional()
  customerToken?: string;
}
